import { el, im, ImCache, imdom } from "im-js";
import * as bl from "blog-lang";
import { imBegin, imEnd, imFlex, imStr } from "ui-primitives";
import { BLOCK, CENTER, COL, cssVars, imui, INLINE, NA, PX, ROW } from "im-ui";
import { imHandleTextAreaEvent, imTextAreaBegin, imTextAreaEnd } from "im-ui/editable-text-area";
import { imButtonBegin, imButtonStyle } from "im-ui/im-button";

function imMain(c: ImCache) {
	im.CacheBegin(c, imMain); {
		imdom.RootBegin(c, document.body); {
			const ev = imdom.GlobalEventSystemBegin(c); {
				imApp(c);
			} imdom.GlobalEventSystemEnd(c, ev);
		} imdom.RootEnd(c, document.body);
	} im.CacheEnd(c);
}

type AppState = {
	markup: string;
	markupVersion: number;
	blogpost: bl.BlogPost | undefined;
};

function newAppState(): AppState {
	const loaded = loadState();
	if (loaded) {
		return loaded;
	}

	return {
		markup: "",
		markupVersion: 0,
		blogpost: undefined,
	};
}

const STATE_KEY = "BlongLang_State";

function saveState(state: AppState) {
	const json = JSON.stringify(state);
	localStorage.setItem(STATE_KEY, json);
}

let debounceTimeout = 0;
let saveStartedAt   = 0;
let saving          = false;
function saveStateDebounced(state: AppState) {
	saveStartedAt = Date.now();
	saving        = true;

	clearTimeout(debounceTimeout);
	debounceTimeout = setTimeout(() => {
		saveState(state);
		saving = false;
	}, 1000);
}

function loadState(): AppState | undefined {
	const val = localStorage.getItem(STATE_KEY);
	if (!val) {
		return undefined;
	}

	try {
		const loaded = JSON.parse(val);
		return loaded as AppState;
	} catch(err) {
		console.error(err);
	}

	return undefined;
}


function imApp(c: ImCache) {
	if (im.isFirstRender(c)) {
		imdom.setStyle(c, "fontFamily", "Inter")
		imdom.setStyle(c, "fontSize", "1.2em")
	}

	const s = im.State(c, newAppState);

	if (im.Memo(c, s.markupVersion)) {
		s.blogpost = bl.parse(s.markup);
		saveStateDebounced(s);
	}

	imBegin(c, ROW); imui.Absolute(c, 0, PX, 0, PX, 0, PX, 0, PX); {
		imBegin(c, BLOCK); imFlex(c); {
			if (im.If(c) && s.blogpost && s.blogpost.blocks.length > 0) {
				imRenderBlocks(c, s.blogpost.blocks);
			} else {
				im.Else(c);
				imStr(c, "start typing (over there -->)");
			} im.IfEnd(c);
		} imEnd(c);
		imBegin(c, BLOCK); imFlex(c);  {
			const [, textArea] = imTextAreaBegin(c, {
				value: s.markup,
			}); {
				const ev = imHandleTextAreaEvent(c, textArea);
				if (ev) {
					if (ev.newText !== undefined) {
						s.markup = ev.newText;
						s.markupVersion += 1;
					}
				}
			} imTextAreaEnd(c);
		} imEnd(c);
	} imEnd(c);
}

imui.init();

const globalImCache: ImCache = [];
imMain(globalImCache);

function imRenderBlocks(c: ImCache, blocks: bl.Block[]) {
	im.For(c); for (const block of blocks) {
		imRenderBlogpostBlock(c, block);
	} im.ForEnd(c);
}

function imRenderBlogpostBlock(c: ImCache, block: bl.Block) {
	imBegin(c, BLOCK); {
		if (im.isFirstRender(c)) {
			imdom.setStyle(c, "padding", "0 0 0.5em 0");
		}

		im.Switch(c, block.type); switch(block.type) {
			case bl.B_TEXT: {
				im.Switch(c, block.style); switch(block.style) {
					case bl.S_NORMAL: {
						imBegin(c, BLOCK); {
							imRenderBlogpostBlockItems(c, block.inlineItems);
						} imEnd(c);
					} break;
					case bl.S_HEADING1: {
						imdom.ElBegin(c, el.H1); {
							imRenderBlogpostBlockItems(c, block.inlineItems);
						} imdom.ElEnd(c, el.H1);
					} break;
					case bl.S_HEADING2: {
						imdom.ElBegin(c, el.H2); {
							imRenderBlogpostBlockItems(c, block.inlineItems);
						} imdom.ElEnd(c, el.H2);
					} break;
					case bl.S_HEADING3: {
						imdom.ElBegin(c, el.H3); {
							imRenderBlogpostBlockItems(c, block.inlineItems);
						} imdom.ElEnd(c, el.H3);
					} break;
					case bl.S_QUOTE: {
					} break;
				} im.SwitchEnd(c)
			} break;
			case bl.B_CODE: {
				imBegin(c, BLOCK); imui.Relative(c); {
					if (im.isFirstRender(c)) {
						imdom.setStyle(c, "backgroundColor", cssVars.bg2);
					}
					imBegin(c, BLOCK); imui.Absolute(c, 0, PX, 0, PX, 0, NA, 0, NA); {
						if (im.isFirstRender(c)) {
							imdom.setStyle(c, "fontSize", "0.7em");
							imdom.setStyle(c, "fontStyle", "italic");
							imdom.setStyle(c, "whiteSpace", "pre-wrap");
							imdom.setStyle(c, "color", cssVars.fg2);
						}
						imStr(c, block.language);
					} imEnd(c);
					imBegin(c, BLOCK); {
						if (im.isFirstRender(c)) {
							imdom.setStyle(c, "fontFamily", "monospace");
							imdom.setStyle(c, "whiteSpace", "pre-wrap");
						}
						imStr(c, block.code);
					} imEnd(c);
				} imEnd(c);
			} break;
			case bl.B_LIST: {
				const dotpointWidth = 8;
				const dotpointPadding = 10;
				im.Switch(c, block.style); switch(block.style) {
					case bl.LS_TAB: {
						imBegin(c, BLOCK); {
							if (im.isFirstRender(c)) {
								imdom.setStyle(c, "paddingLeft", (dotpointWidth + 2 * dotpointPadding) + "px");
							}

							imRenderBlocks(c, block.blocks);
						} imEnd(c);
					} break;
					case bl.LS_DOT: {
						imBegin(c, ROW); {
							imBegin(c, BLOCK); {
								imBegin(c, ROW, CENTER, CENTER); {
									if (im.isFirstRender(c)) {
										imdom.setStyle(c, "height", "1.25em");
										imdom.setStyle(c, "paddingLeft", dotpointPadding + "px");
										imdom.setStyle(c, "paddingRight", dotpointPadding + "px");
									}
									imBegin(c, BLOCK); {
										if (im.isFirstRender(c)) {
											imdom.setStyle(c, "backgroundColor", cssVars.fg);
											imdom.setStyle(c, "borderRadius", "8px");
											imdom.setStyle(c, "width",  dotpointWidth + "px");
											imdom.setStyle(c, "height", dotpointWidth + "px");
										}
									} imEnd(c);
								} imEnd(c);
							} imEnd(c);
							imBegin(c, BLOCK); imFlex(c); {
								imRenderBlocks(c, block.blocks);
							} imEnd(c);
						} imEnd(c);
					} break;
				} im.SwitchEnd(c);
			} break;
			case bl.B_TABLE: {
				imBegin(c, BLOCK); {
					im.For(c); for (const row of block.rows) {
						imBegin(c, ROW); {
							im.For(c); for (const cell of row.cells) {
								imBegin(c, BLOCK); imFlex(c); {
									imRenderBlocks(c, cell.contents);
								} imEnd(c);
							} im.ForEnd(c);
						} imEnd(c);
					} im.ForEnd(c);
				} imEnd(c);
			} break;
		} im.SwitchEnd(c);
	} imEnd(c);
}

function imRenderBlogpostBlockItems(c: ImCache, items: bl.InlineItem[]) {
	im.For(c); for (const item of items) {
		im.Switch(c, item.type); switch(item.type) {
			case bl.T_TEXT: imRenderItemText(c, item); break;
			case bl.T_CODE: imRenderItemCode(c, item); break;
			case bl.T_URL:  imRenderItemUrl(c, item);  break;
		} im.SwitchEnd(c);
	} im.ForEnd(c);
}

function imRenderItemText(c: ImCache, item: bl.InlineText) {
	imBegin(c, INLINE); {
		if (im.isFirstRender(c)) {
			imdom.setStyle(c, "fontStyle",      (item.styleFlags & bl.V_ITALIC)        ? "italic" : "");
			imdom.setStyle(c, "fontWeight",     (item.styleFlags & bl.V_BOLD)          ? "bold" : "");
			imdom.setStyle(c, "textDecoration", (item.styleFlags & bl.V_STRIKETHROUGH) ? "line-through" : "");
		}
		imStr(c, item.text);
	} imEnd(c);
}

function imRenderItemCode(c: ImCache, item: bl.InlineCode) {
	imBegin(c, INLINE); {
		if (im.isFirstRender(c)) {
			imdom.setStyle(c, "backgroundColor", cssVars.bg2);
			imdom.setStyle(c, "fontFamily", "monospace");
		}
		imStr(c, item.code);
	} imEnd(c);
}

function imRenderItemUrl(c: ImCache, item: bl.InlineUrl) {
	imBegin(c, INLINE); {
		imdom.ElBegin(c, el.A); {
			imButtonStyle(c, false);

			const url        = item.url;
			const urlChanged = im.Memo(c, url);
			if (urlChanged) {
				imdom.setAttr(c, "href", url);
			}

			imStr(c, item.text);

			if (im.If(c) && imdom.hasMouseOver(c)) {
				let domain: URL | undefined = im.GetInline(c, imRenderItemUrl);
				if (!domain || urlChanged){
					const urlObj =  new URL(url);
					domain = im.Set(c, urlObj);
				}
				imStr(c, " -> ");
				imStr(c, url);
			} im.IfEnd(c);
		} imdom.ElEnd(c, el.A);
	} imEnd(c);
}

