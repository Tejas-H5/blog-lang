import * as bl from "blog-lang";
import { EXAMPLE_BLOG } from "example";
import { el, im, ImCache, imdom } from "im-js";
import { CENTER, COL, cssVars, imui, INLINE, NA, PX, ROW } from "im-ui";
import { imHandleTextAreaEvent, imTextAreaBegin, imTextAreaEnd } from "im-ui/editable-text-area";
import { imButtonStyle } from "im-ui/im-button";
import { imBegin, imEnd, imFlex, imStr } from "ui-primitives";

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
		markup: EXAMPLE_BLOG,
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
		imBegin(c); imFlex(c); {
			if (im.If(c) && s.blogpost && s.blogpost.blocks.length > 0) {
				imBegin(c); imui.Padding(c, 15, PX, 15, PX, 15, PX, 15, PX); {
					imRenderBlocks(c, s.blogpost.blocks, 0);
				} imEnd(c);
			} else {
				im.Else(c);
				imStr(c, "start typing (over there -->)");
			} im.IfEnd(c);
		} imEnd(c);
		imBegin(c); imFlex(c);  {
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

function imRenderBlocks(c: ImCache, blocks: bl.Block[], depth: number) {
	imBegin(c, COL); imui.Gap(c, 5, PX); {
		im.For(c); for (let i = 0; i < blocks.length; i++) {
			const block = blocks[i];
			let needsExtraSpace = false;
			if (i > 0) {
				const prevBlock = blocks[i - 1];
				// Determine if we need spacing or not.
				if (block.type === bl.B_TEXT) {
					needsExtraSpace = true;
				}
			}

			if (im.If(c) && needsExtraSpace) {
				imBegin(c); imui.Size(c, 0, NA, 10, PX); imEnd(c);
			} im.IfEnd(c);

			imRenderBlogpostBlock(c, block, depth);
		} im.ForEnd(c);
	} imEnd(c);
}

function imRenderBlogpostBlock(c: ImCache, block: bl.Block, depth = 0) {
	imBegin(c); {
		im.Switch(c, block.type); switch(block.type) {
			case bl.B_TEXT: {
				im.Switch(c, block.style); switch(block.style) {
					case bl.S_NORMAL: {
						imBegin(c); {
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
				imBegin(c); imui.Relative(c); {
					if (im.isFirstRender(c)) {
						imdom.setStyle(c, "backgroundColor", cssVars.bg2);
					}
					imBegin(c); imui.Absolute(c, 0, PX, 0, PX, 0, NA, 0, NA); {
						if (im.isFirstRender(c)) {
							imdom.setStyle(c, "fontSize", "0.7em");
							imdom.setStyle(c, "fontStyle", "italic");
							imdom.setStyle(c, "whiteSpace", "pre-wrap");
							imdom.setStyle(c, "color", cssVars.fg2);
						}
						imStr(c, block.language);
					} imEnd(c);
					imBegin(c); {
						if (im.isFirstRender(c)) {
							imdom.setStyle(c, "fontFamily", "monospace");
							imdom.setStyle(c, "whiteSpace", "pre-wrap");
						}
						imStr(c, block.code);
					} imEnd(c);
				} imEnd(c);
			} break;
			case bl.B_LIST: {
				// They should all be indented identically
				const variant = depth % 4;
				const dotpointWidth = getDotpointWidth(variant);
				const dotpointPadding = 10;

				im.Switch(c, block.style); switch(block.style) {
					case bl.LS_TAB: {
						imBegin(c); {
							if (im.isFirstRender(c)) {
								imdom.setStyle(c, "paddingLeft", (dotpointWidth + 2 * dotpointPadding) + "px");
							}

							imRenderBlocks(c, block.blocks, depth + 1);
						} imEnd(c);
					} break;
					case bl.LS_DOT: {
						imBegin(c, ROW); {
							imBegin(c); {
								imBegin(c, ROW, CENTER, CENTER); {
									if (im.isFirstRender(c)) {
										imdom.setStyle(c, "height", "1.25em");
										imdom.setStyle(c, "paddingLeft", dotpointPadding + "px");
										imdom.setStyle(c, "paddingRight", dotpointPadding + "px");
									}
									imBegin(c); {
										if (im.isFirstRender(c)) {
											if (variant === 0) {
												imdom.setStyle(c, "backgroundColor", cssVars.fg);
												imdom.setStyle(c, "borderRadius", "8px");
												imdom.setStyle(c, "width",  dotpointWidth + "px");
												imdom.setStyle(c, "height", dotpointWidth + "px");
											} else if (variant === 1) {
												imdom.setStyle(c, "border", "1px solid " + cssVars.fg);
												imdom.setStyle(c, "borderRadius", "8px");
												imdom.setStyle(c, "width",  dotpointWidth + "px");
												imdom.setStyle(c, "height", dotpointWidth + "px");
											} else if (variant === 2) {
												imdom.setStyle(c, "backgroundColor", cssVars.fg);
												imdom.setStyle(c, "width",  dotpointWidth + "px");
												imdom.setStyle(c, "height", dotpointWidth + "px");
											} else if (variant === 3) {
												imdom.setStyle(c, "border", "1px solid " + cssVars.fg);
												imdom.setStyle(c, "width",  dotpointWidth + "px");
												imdom.setStyle(c, "height", dotpointWidth + "px");
											}
										}
									} imEnd(c);
								} imEnd(c);
							} imEnd(c);
							imBegin(c); imFlex(c); {
								imRenderBlocks(c, block.blocks, depth + 1);
							} imEnd(c);
						} imEnd(c);
					} break;
				} im.SwitchEnd(c);
			} break;
			case bl.B_TABLE: {
				imBegin(c); {
					im.For(c); for (const row of block.rows) {
						imBegin(c, ROW); {
							im.For(c); for (const cell of row.cells) {
								imBegin(c); imFlex(c); {
									imRenderBlocks(c, cell.contents, depth + 1);
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


function getDotpointWidth(variant: number) {
	if (variant === 0) return 8;
	if (variant === 1) return 7; // 1px is for the border outline

	// The square must be made to fit within the circles of the previous variants.
	const sin45 = 1 / Math.sqrt(2);
	if (variant === 2) return 8 * sin45;
	if (variant === 3) return 7 * sin45;

	// I suppose I actually need to multiply the base height of the bullet by sin45 here
	// if I want to keep this rule I made up going, but I won't do that

	return 8;
}

