import { assert } from "./assert";
import {
	advance,
	advanceBy,
	compare,
	compareAndAdvance,
	compareAndAdvanceEnd,
	computeStandardString,
	isWhitespace,
	newParser,
	newTextPosition,
	Parser,
	parserPos,
	parseStandardString,
	parseWhitespace,
	reachedEnd,
	reset,
	TextPosition
} from "./parser-utils";

export type BlogPost = {
	blocks: Block[];
};

export const Block_Paragraph       = 0;
export const Block_Heading1        = 1; // Here onwards all start new blocks
export const Block_Heading2        = 2;
export const Block_Heading3        = 3;
export const Block_Heading4        = 4;
export const Block_CodeBlock       = 5;
export const Block_Bullet          = 6;
export const Block_Quote           = 7;
export const Block_List            = 8;
export const Block_Table           = 9;
export const Block_StopParsing     = 10; // Not a real block type - we just use it to know not to parse things
export const Block_Figure          = 12;
export const InlineItem_Text       = 13;
export const InlineItem_Code       = 14; // Inline code can't contain other styling within it.
export const InlineItem_Url        = 15;

export type BaseItem = {
	type:  number;
	start: TextPosition;
	end:   TextPosition;
};

export type TextBlock = BaseItem & {
	type:
	 | typeof Block_Paragraph
	 | typeof Block_Paragraph
	 | typeof Block_Heading1
	 | typeof Block_Heading2
	 | typeof Block_Heading3
	 | typeof Block_Heading4
	 | typeof Block_Bullet
	 | typeof Block_Quote
	 ;

	items: InlineItem[];
};

export type CodeBlock = BaseItem & {
	type:     typeof Block_CodeBlock;
	code:     string;
	language: string;
}

export type ListBlock = BaseItem & {
	type:   typeof Block_List;
	blocks:  Block[];
}

export type TableBlock = BaseItem & {
	type: typeof Block_Table;
	rows: TableRow[];
};

type TableRow = {
	cells: ListBlock[];
};

export type Block = 
 | TextBlock
 | CodeBlock
 | ListBlock
 | TableBlock
 ;

export type InlineTextItem = BaseItem & {
	type: typeof InlineItem_Text | typeof InlineItem_Code;
	// The text is not necessarily just the stubstring between start->end.
	text: string;
	styleFlags: number;
};

export type InlineLinkItem = BaseItem & {
	type: typeof InlineItem_Url;
	// It's important that our tokens have ranges, so that we can eventually make a WYSIWYG editor.
	text: InlineTextItem;
	url:  InlineTextItem;
};

export type InlineItem =
 | InlineTextItem
 | InlineLinkItem
 ;

export const STYLE_BOLD          = 1 << 0;
export const STYLE_ITALIC        = 1 << 1;
export const STYLE_STRIKETHROUGH = 1 << 2;

type ParseContext = {
	styleFlags: number;

	stopParsing: boolean;
};

function newParseContext(): ParseContext {
	return {
		styleFlags:  0,
		stopParsing: false,
	};
}

function getText(parser: Parser, start: TextPosition, end: TextPosition): string {
	return parser.text.substring(start.i, end.i);
}

export function parse(text: string): BlogPost {
	const ctx = newParseContext();

	const parser = newParser(text);

	const result = parseBlockList(parser, ctx);

	return {
		blocks: result.blocks,
	};
}

function parseBlockList(parser: Parser, ctx: ParseContext): ListBlock {
	const start = parserPos(parser);
	const blocks:  Block[] = [];

	while (!reachedEnd(parser)) {
		const block = parseBlock(parser, ctx);
		if (!block) {
			break;
		}

		blocks.push(block);

		if (compare(parser, "]")) {
			// reached end of list
			advance(parser);
			break;
		}
	}

	return {
		type:  Block_List,
		start: start,
		end:   parserPos(parser),
		blocks: blocks,
	};
}

function parseTable(parser: Parser, ctx: ParseContext): TableBlock {
	const start = parserPos(parser);
	const rows: TableRow[] = [];

	while (!reachedEnd(parser)) {
		ctx.stopParsing = false;
		const row = parseTableRow(parser, ctx);
		if (!row) {
			break;
		}

		rows.push(row);

		if (compare(parser, "]")) {
			// reached end of table
			advance(parser);
			break;
		}
	}

	return {
		type:  Block_Table,
		start: start,
		end:   parserPos(parser),
		rows: rows,
	};
}

export function parseBlockType(parser: Parser): Block["type"] | typeof Block_StopParsing {
	if (compareAndAdvance(parser, "#### "))   return Block_Heading4;
	if (compareAndAdvance(parser, "### "))    return Block_Heading3;
	if (compareAndAdvance(parser, "## "))     return Block_Heading2;
	if (compareAndAdvance(parser, "> "))      return Block_Quote;

	if (compareAndAdvance(parser, "#list["))  return Block_List;

	if (compareAndAdvance(parser, "#table[")) return Block_Table;
	if (compare(parser, "#row"))    return Block_StopParsing;
	if (compare(parser, "#cell"))   return Block_StopParsing;

	// Heading conflicts with everything else, so we're checking for it at the end
	if (compareAndAdvance(parser, "# "))      return Block_Heading1;

	if (compareAndAdvance(parser, "- "))      return Block_Bullet;
	if (compareAndAdvance(parser, "```"))     return Block_CodeBlock;

	return Block_Paragraph;
}

function parseBlock(parser: Parser, ctx: ParseContext): Block | undefined {
	if (ctx.stopParsing) return undefined;

	parseWhitespace(parser);
	const type = parseBlockType(parser);

	if (type === Block_CodeBlock) return parseCodeBlock(parser, ctx);
	if (type === Block_List)      return parseBlockList(parser, ctx);
	if (type === Block_Table)     return parseTable(parser, ctx);

	if (type === Block_StopParsing) {
		ctx.stopParsing = true;
		return undefined;
	}

	const block = parseTextBlock(parser, ctx, type);
	if (getText(parser, block.start, block.end).trim().length === 0) {
		return undefined;
	}

	return block;
}

function parseTableRow(parser: Parser, ctx: ParseContext): TableRow | undefined {
	parseWhitespace(parser);
	if (!compareAndAdvance(parser, "#row")) {
		parseWhitespace(parser);
		if (!compareAndAdvance(parser, "]")) {
			// We are missing a ] here. But probably not a big deal, so I'm doing nothing
		}

		return undefined;
	}

	const cells: ListBlock[] = []; 

	while (!reachedEnd(parser)) {
		parseWhitespace(parser);
		if (!compareAndAdvance(parser, "#cell")) {
			break;
		}

		parseWhitespace(parser);
		ctx.stopParsing = false;
		const blocks = parseBlockList(parser, ctx);
		cells.push(blocks);
	}

	return {
		cells: cells,
	};
}

export function parseCodeBlock(parser: Parser, ctx: ParseContext): CodeBlock {
	let language = parseTextToNextLine(parser);

	const start = parserPos(parser);
	let end: TextPosition | undefined;
	while (!reachedEnd(parser)) {
		advance(parser);

		end = compareAndAdvanceEnd(parser, "\r\n```") ??
			  compareAndAdvanceEnd(parser, "\n```");
		if (end) {
			break;
		}
	}

	if (!end) end = parserPos(parser);

	return {
		type:  Block_CodeBlock,
		start: start,
		end:   end,

		code:     getText(parser, start, end),
		language: language,
	};
}

function parseTextToNextLine(parser: Parser): string {
	let start = parser.pos.i;

	while (parser.char !== "\n") {
		advance(parser);
	}
	advance(parser);

	return parser.text.substring(start, parser.pos.i - 1);
}

function setBitFlag(flags: number, mask: number, on: boolean): number {
	let result = flags;

	if (on) {
		result = result | mask;
	} else {
		result = result & (~mask);
	}

	return result;
}

export function parseTextBlock(parser: Parser, ctx: ParseContext, type: TextBlock["type"]): TextBlock {
	let start = parserPos(parser);

	const items: InlineItem[] = [];

	let prevEnd = start;
	let betweenLineStartAndFirstChar = true;
	while (!reachedEnd(parser)) {
		if (!isWhitespace(parser.char)) {
			betweenLineStartAndFirstChar = false;
		}

		const textBeforeBoldStart = compareAndAdvanceEnd(parser, "*");
		if (textBeforeBoldStart) {
			pushTextItem(parser, ctx.styleFlags, items, prevEnd, textBeforeBoldStart, false);
			prevEnd = parserPos(parser);
			ctx.styleFlags = setBitFlag(ctx.styleFlags, STYLE_BOLD, !(ctx.styleFlags & STYLE_BOLD));
			continue;
		}

		const textBeforeItalicStart = compareAndAdvanceEnd(parser, "_");
		if (textBeforeItalicStart) {
			pushTextItem(parser, ctx.styleFlags, items, prevEnd, textBeforeItalicStart, false);
			prevEnd = parserPos(parser);
			ctx.styleFlags = setBitFlag(ctx.styleFlags, STYLE_ITALIC, !(ctx.styleFlags & STYLE_ITALIC));
			continue;
		}

		const textBeforeStrikethroughStart = compareAndAdvanceEnd(parser, "~");
		if (textBeforeStrikethroughStart) {
			pushTextItem(parser, ctx.styleFlags, items, prevEnd, textBeforeStrikethroughStart, false);
			prevEnd = parserPos(parser);
			ctx.styleFlags = setBitFlag(ctx.styleFlags, STYLE_STRIKETHROUGH, !(ctx.styleFlags & STYLE_STRIKETHROUGH));
			continue;
		}

		const textBeforeInlineBlockStart = compareAndAdvanceEnd(parser, "`");
		if (textBeforeInlineBlockStart) {
			pushTextItem(parser, ctx.styleFlags, items, prevEnd, textBeforeInlineBlockStart, false);

			parseInlineCodeBlock(parser, items, parserPos(parser));
			prevEnd = parserPos(parser);
			continue;
		}

		const textBeforeLinkStart = compareAndAdvanceEnd(parser, "#url[");
		if (textBeforeLinkStart) {
			pushTextItem(parser, ctx.styleFlags, items, prevEnd, textBeforeLinkStart, false);
			const link = parseUrl(parser, textBeforeLinkStart);
			if (link) {
				items.push(link);
			}
			prevEnd = parserPos(parser);
			continue;
		}

		advance(parser);
		if (parser.char === "\n") {
			betweenLineStartAndFirstChar = true;
		} else if (!isWhitespace(parser.char)) {
			betweenLineStartAndFirstChar = false;
		}

		if (betweenLineStartAndFirstChar) {
			// TODO: fix allocations
			// Need to break out of a block if
			// we've found the start of the next block
			const pos = parserPos(parser);
			advance(parser);
			const resetPos = parserPos(parser);
			const type = parseBlockType(parser);
			if (type !== Block_Paragraph) {
				reset(parser, resetPos);
				pushTextItem(parser, ctx.styleFlags, items, prevEnd, pos, true);
				prevEnd = parserPos(parser);
				break;
			}

			reset(parser, pos);
		}

		const blockEnd = 
			compareAndAdvanceEnd(parser, "\r\n\r\n") ?? 
			compareAndAdvanceEnd(parser, "\n\n")
			;

		if (blockEnd) {
			pushTextItem(parser, ctx.styleFlags, items, prevEnd, blockEnd, true);
			prevEnd = parserPos(parser);
			break;
		}

		// Need to break out of a list if we've found the end. 
		if (compare(parser, "]")) {
			pushTextItem(parser, ctx.styleFlags, items, prevEnd, parserPos(parser), true);
			prevEnd = parserPos(parser);
			break;
		}

		if (reachedEnd(parser)) {
			// End of paragraph
			pushTextItem(parser, ctx.styleFlags, items, prevEnd, parserPos(parser), true);
			prevEnd = parserPos(parser);
			break;
		}
	}

	const end = parserPos(parser);

	return {
		type:  type,
		start: start,
		end:   end,
		items: items,
	};
}

function pushTextItem(
	parser: Parser,
	styleFlags: number,
	items: InlineItem[],
	start: TextPosition, end: TextPosition, shouldTrimEnd: boolean
) {
	let text = getText(parser, start, end);
	if (shouldTrimEnd) {
		text = text.trimEnd();
	}

	if (text.length > 0) {
		items.push({
			type:  InlineItem_Text,
			start: start,
			end:   end, 
			text:  text,
			styleFlags: styleFlags,
		})
	}
}

function parseInlineCodeBlock(parser: Parser, items: InlineItem[], start: TextPosition) {
	while (!reachedEnd(parser)) {
		const end = compareAndAdvanceEnd(parser, "`");
		if (end) {
			items.push({
				type:  InlineItem_Code,
				start: start,
				end:   end,
				text:  getText(parser, start, end),
				styleFlags: 0,
			});
			break;
		}

		advance(parser);
	}
}

function parseOptionalCommaOrEndOfFunctionArgs(parser: Parser) {
	if (compareAndAdvance(parser, "]")) {
		return;
	}

	if (compareAndAdvance(parser, ",")) {
		advance(parser);
		parseWhitespace(parser);
	}
}

// NOTE: functions are like #expr[a, b, c]
function parseFunctionArgument(parser: Parser): InlineTextItem | undefined {
	const start = parserPos(parser);

	let end       = parseStandardString(parser, '"');
	if (!end) end = parseStandardString(parser, "'");
	if (!end) end = parseStandardString(parser, "`");
	if (end) {
		const arg = computeStandardString(parser, start, end);

		parseOptionalCommaOrEndOfFunctionArgs(parser);

		return {
			type: InlineItem_Text,
			start: start,
			end:   end,
			text:  arg,
			styleFlags: 0,
		};
	}

	// Just try parsing to the next , or )
	while (!reachedEnd(parser)) {
		advance(parser);
		if (parser.char === "]" || parser.char === ",") {
			end = parserPos(parser);
			break;
		}
	}

	if (!end) {
		reset(parser, start);
		return undefined;
	}

	const text = getText(parser, start, end).trim();
	advance(parser);

	return {
		type:  InlineItem_Text,
		start: start, 
		end:   end,
		text:  text,
		styleFlags: 0,
	};
}

function parseUrl(parser: Parser, start: TextPosition): InlineLinkItem | undefined {
	const urlOrText = parseFunctionArgument(parser);
	if (!urlOrText) {
		return undefined;
	}

	let url  = urlOrText;
	let text = urlOrText;
	const realUrl = parseFunctionArgument(parser);
	if  (realUrl) {
		url = realUrl;
	}

	return {
		type:  InlineItem_Url,
		start: start,
		end:   parserPos(parser),
		text:  text,
		url:   url,
	};
}
