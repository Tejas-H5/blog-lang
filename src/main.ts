import { EXAMPLE_BLOG } from "example";
import { im, ImCache, imdom } from "im-js";
import { imui, PX, ROW } from "im-ui";
import { imSimpleTextArea } from "im-ui/components/im-editable-text-area";
import { imRenderBlogLangMarkup } from "im-ui/components/im-blog-lang-viewer";
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
};

function newAppState(): AppState {
	const loaded = loadState();
	if (loaded) {
		return loaded;
	}

	return {
		markup: EXAMPLE_BLOG,
		markupVersion: 0,
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
		saveStateDebounced(s);
	}

	imBegin(c, ROW); imui.Absolute(c, 0, PX, 0, PX, 0, PX, 0, PX); {
		imBegin(c); imFlex(c); {
			if (im.If(c) && s.markup) {
				imBegin(c); imui.Padding(c, 15, PX, 15, PX, 15, PX, 15, PX); {
					imRenderBlogLangMarkup(c, s.markup, s.markupVersion);
				} imEnd(c);
			} else {
				im.Else(c);
				imStr(c, "start typing (over there -->)");
			} im.IfEnd(c);
		} imEnd(c);
		imBegin(c); imFlex(c);  {
			const ev = imSimpleTextArea(c, s.markup);
			if (ev) {
				if (ev.newText !== undefined) {
					s.markup = ev.newText;
					s.markupVersion += 1;
				}
			}
		} imEnd(c);
	} imEnd(c);
}

imui.init();

const globalImCache: ImCache = [];
imMain(globalImCache);
