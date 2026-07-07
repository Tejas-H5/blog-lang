import * as test from "testing/testing";
import * as bl from ".";

test.file("./parser.test.ts");

function testBlockIsText(r: test.Result, block: bl.Block, text: string) {
	test.assertEqual(r, block.type, bl.B_TEXT);
	test.assertEqual(r, block.inlineItems.length, 1);
	test.assertEqual(r, block.inlineItems[0].type, bl.T_TEXT);
	test.assertEqual(r, block.inlineItems[0].text, text);
}

test.group("Paragraphs", [], () => {
	test.add("Parses some text as one paragraph", r => {
		const result = bl.parse("Hello there");
		test.assertEqual(r, result.blocks.length, 1);
		testBlockIsText(r, result.blocks[0], "Hello there");
	});

	test.add("Parses double-newline as a new paragraph", r => {
		const result = bl.parse("A\n\nHi 2");
		test.checkEqual(r, result.blocks.length, 2);
		testBlockIsText(r, result.blocks[0], "A");
		testBlockIsText(r, result.blocks[1], "Hi 2");
	});

	// TODO: consider preserving this space, so that the output is more representative.
	test.add("Triple newline is also fine", r => {
		const result = bl.parse("A\n\n\n\n\nHi 2");
		test.checkEqual(r, result.blocks.length, 2);
		testBlockIsText(r, result.blocks[0], "A");
		testBlockIsText(r, result.blocks[1], "Hi 2");
	});
})

test.group("Headings", [], () => {
	test.add("Parses Heading level 3", r => {
		const result = bl.parse("### Hello there");
		test.assertEqual(r, result.blocks.length, 1);
		test.assertEqual(r, result.blocks[0].type, bl.B_TEXT);
		test.assertEqual(r, result.blocks[0].style, bl.S_HEADING3);
		testBlockIsText(r,  result.blocks[0], "Hello there");
	});

	test.add("Parses Heading level 2", r => {
		const result = bl.parse("## Hello there");
		test.assertEqual(r, result.blocks.length, 1);
		test.assertEqual(r, result.blocks[0].type, bl.B_TEXT);
		test.assertEqual(r, result.blocks[0].style, bl.S_HEADING2);
		testBlockIsText(r,  result.blocks[0], "Hello there");
	});

	test.add("Parses Heading level 1", r => {
		const result = bl.parse("# Hello there");
		test.assertEqual(r, result.blocks.length, 1);
		test.assertEqual(r, result.blocks[0].type, bl.B_TEXT);
		test.assertEqual(r, result.blocks[0].style, bl.S_HEADING1);
		testBlockIsText(r,  result.blocks[0], "Hello there");
	});

	test.add("Heading parsing works with single new line", r => {
		const result = bl.parse("# Hello\n# there");
		test.assertEqual(r, result.blocks.length, 2);
		test.assertEqual(r, result.blocks[0].type, bl.B_TEXT);
		test.assertEqual(r, result.blocks[0].style, bl.S_HEADING1);
		testBlockIsText(r,  result.blocks[0], "Hello");
		test.assertEqual(r, result.blocks[1].type, bl.B_TEXT);
		test.assertEqual(r, result.blocks[1].style, bl.S_HEADING1);
		testBlockIsText(r,  result.blocks[1], "there");
	});
})

test.group("Quotes", [], () => {
	test.add("Parses quote", r => {
		const result = bl.parse("> Hello there");
		test.assertEqual(r,  result.blocks.length, 1);
		test.assertEqual(r, result.blocks[0].type, bl.B_TEXT);
		test.assertEqual(r, result.blocks[0].style, bl.S_QUOTE);
		testBlockIsText(r, result.blocks[0], "Hello there");
	});
});

test.group("Code blocks", [], () => {
	test.add("Parses code blocks", r => {
		const result = bl.parse("```\nOMG\n```");
		test.checkEqual(r, result.blocks.length, 1);
		test.assertEqual(r, result.blocks[0].type, bl.B_CODE);
		test.checkEqual(r, result.blocks[0].code, "OMG\n");
		test.checkEqual(r, result.blocks[0].language, "");
	});

	test.add("Parses code blocks", r => {
		const result = bl.parse("``` pl2 hey I can put anything here WTF ()@)(@!)(!*@\nOMG\n```");
		test.checkEqual(r, result.blocks.length, 1);
		test.assertEqual(r, result.blocks[0].type, bl.B_CODE);
		test.checkEqual(r, result.blocks[0].code, "OMG\n");
		test.checkEqual(r, result.blocks[0].language, " pl2 hey I can put anything here WTF ()@)(@!)(!*@");
	});
});


test.group("Inline code blocks", [], () => {
	test.add("Parses text block with a code bock in it", r => {
		const result = bl.parse("Hi `there`!");
		test.assertEqual(r,  result.blocks.length, 1);
		test.assertEqual(r,  result.blocks[0].type, bl.B_TEXT);

		test.assertEqual(r,  result.blocks[0].inlineItems[0].type, bl.T_TEXT);
		test.assertEqual(r,  result.blocks[0].inlineItems[0].text, "Hi ");

		test.assertEqual(r,  result.blocks[0].inlineItems[1].type, bl.T_CODE);
		test.assertEqual(r,  result.blocks[0].inlineItems[1].code, "there");

		test.assertEqual(r,  result.blocks[0].inlineItems[2].type, bl.T_TEXT);
		test.assertEqual(r,  result.blocks[0].inlineItems[2].text, "!");
	});

	test.add("Parses text starting with a code bock in it", r => {
		const result = bl.parse("`there`!");
		test.assertEqual(r,  result.blocks.length, 1);
		test.assertEqual(r, result.blocks[0].type, bl.B_TEXT);
		test.checkEqual(r,  result.blocks[0].inlineItems.length, 2);

		test.assertEqual(r, result.blocks[0].inlineItems[0].type, bl.T_CODE);
		test.checkEqual(r,  result.blocks[0].inlineItems[0].code, "there");

		test.assertEqual(r, result.blocks[0].inlineItems[1].type, bl.T_TEXT);
		test.checkEqual(r,  result.blocks[0].inlineItems[1].text, "!");
	});
	
	test.add("Parses text starting with a code bock in it", r => {
		const result = bl.parse("Hi `there`");
		test.assertEqual(r,  result.blocks.length, 1);
		test.assertEqual(r, result.blocks[0].type, bl.B_TEXT);
		test.checkEqual(r,  result.blocks[0].inlineItems.length, 2);

		test.assertEqual(r, result.blocks[0].inlineItems[0].type, bl.T_TEXT);
		test.checkEqual(r,  result.blocks[0].inlineItems[0].text, "Hi ");

		test.assertEqual(r, result.blocks[0].inlineItems[1].type, bl.T_CODE);
		test.checkEqual(r,  result.blocks[0].inlineItems[1].code, "there");
	});
	
	test.add("Parses text starting with a code bock in it", r => {
		const result = bl.parse("`there`");
		test.assertEqual(r,  result.blocks.length, 1);
		test.assertEqual(r, result.blocks[0].type, bl.B_TEXT);
		test.checkEqual(r,  result.blocks[0].inlineItems.length, 1);

		test.assertEqual(r, result.blocks[0].inlineItems[0].type, bl.T_CODE);
		test.checkEqual(r,  result.blocks[0].inlineItems[0].code, "there");
	});
});

test.group("Urls", [], () => {
	test.add("Parses singular url", r => {
		const result = bl.parse("find my blog #url[here]");
		test.assertEqual(r, result.blocks.length, 1);
		test.assertEqual(r, result.blocks[0].type, bl.B_TEXT);
		test.checkEqual(r,  result.blocks[0].inlineItems.length, 2);

		test.assertEqual(r, result.blocks[0].inlineItems[0].type, bl.T_TEXT);
		test.checkEqual(r,  result.blocks[0].inlineItems[0].text, "find my blog ");

		test.assertEqual(r, result.blocks[0].inlineItems[1].type, bl.T_URL);
		test.checkEqual(r,  result.blocks[0].inlineItems[1].text, "here");
		test.checkEqual(r,  result.blocks[0].inlineItems[1].url, "here");
	});

	test.add("Parses link, url pair", r => {
		const result = bl.parse("find my blog #url[here, link]");
		test.assertEqual(r, result.blocks.length, 1);
		test.assertEqual(r, result.blocks[0].type, bl.B_TEXT);
		test.checkEqual(r,  result.blocks[0].inlineItems.length, 2);

		test.assertEqual(r, result.blocks[0].inlineItems[0].type, bl.T_TEXT);
		test.checkEqual(r,  result.blocks[0].inlineItems[0].text, "find my blog ");

		test.assertEqual(r, result.blocks[0].inlineItems[1].type, bl.T_URL);
		test.checkEqual(r,  result.blocks[0].inlineItems[1].text, "here");
		test.checkEqual(r,  result.blocks[0].inlineItems[1].url, "link");
	});

	test.add("Parses link, url pair but they are strings", r => {
		const result = bl.parse("find my blog #url['\"here\"', \"'link'\"]");
		test.assertEqual(r, result.blocks.length, 1);
		test.assertEqual(r, result.blocks[0].type, bl.B_TEXT);
		test.checkEqual(r,  result.blocks[0].inlineItems.length, 2);

		test.assertEqual(r, result.blocks[0].inlineItems[0].type, bl.T_TEXT);
		test.checkEqual(r,  result.blocks[0].inlineItems[0].text, "find my blog ");

		test.assertEqual(r, result.blocks[0].inlineItems[1].type, bl.T_URL);
		test.checkEqual(r,  result.blocks[0].inlineItems[1].text, "here");
		test.checkEqual(r,  result.blocks[0].inlineItems[1].url, "link");
	});

	test.add("Parses url surrounded by text", r => {
		const result = bl.parse("find my blog #url['\"here\"', \"'link'\"]\n\nNew paragraph");
		test.assertEqual(r, result.blocks.length, 2);
		test.assertEqual(r, result.blocks[0].type, bl.B_TEXT);

		test.assertEqual(r, result.blocks[0].inlineItems.length, 2);
		test.assertEqual(r, result.blocks[0].inlineItems[0].type, bl.T_TEXT);
		test.assertEqual(r, result.blocks[0].inlineItems[1].type, bl.T_URL);

		testBlockIsText(r, result.blocks[1], "New paragraph");
	});
});

test.group("Style flags", [], () => {
	test.add("Parses italic inside text", r => {
		const result = bl.parse("it _was_ real");
		test.assertEqual(r, result.blocks.length, 1);
		test.assertEqual(r, result.blocks[0].type, bl.B_TEXT);
		test.checkEqual(r,  result.blocks[0].inlineItems.length, 3);

		test.assertEqual(r, result.blocks[0].inlineItems[0].type, bl.T_TEXT);
		test.checkEqual(r,  result.blocks[0].inlineItems[0].text, "it ");
		test.checkEqual(r,  result.blocks[0].inlineItems[0].styleFlags, 0);

		test.assertEqual(r, result.blocks[0].inlineItems[1].type, bl.T_TEXT);
		test.checkEqual(r,  result.blocks[0].inlineItems[1].text, "was");
		test.checkEqual(r,  result.blocks[0].inlineItems[1].styleFlags, bl.V_ITALIC);

		test.assertEqual(r, result.blocks[0].inlineItems[2].type, bl.T_TEXT);
		test.checkEqual(r,  result.blocks[0].inlineItems[2].text, " real");
		test.checkEqual(r,  result.blocks[0].inlineItems[2].styleFlags, 0);
	});

	test.add("Parses italic on it's own", r => {
		const result = bl.parse("_amazing_");
		test.assertEqual(r, result.blocks.length, 1);
		test.assertEqual(r, result.blocks[0].type, bl.T_TEXT);
		test.checkEqual(r,  result.blocks[0].inlineItems.length, 1);

		test.assertEqual(r, result.blocks[0].inlineItems[0].type, bl.T_TEXT);
		test.checkEqual(r,  result.blocks[0].inlineItems[0].text, "amazing");
		test.checkEqual(r,  result.blocks[0].inlineItems[0].styleFlags, bl.V_ITALIC);
	});

	test.add("Parses bold inside text", r => {
		const result = bl.parse("it *was* real");
		test.assertEqual(r, result.blocks.length, 1);
		test.assertEqual(r, result.blocks[0].type, bl.B_TEXT);
		test.checkEqual(r,  result.blocks[0].inlineItems.length, 3);

		test.assertEqual(r, result.blocks[0].inlineItems[0].type, bl.T_TEXT);
		test.checkEqual(r,  result.blocks[0].inlineItems[0].text, "it ");
		test.checkEqual(r,  result.blocks[0].inlineItems[0].styleFlags, 0);

		test.assertEqual(r, result.blocks[0].inlineItems[1].type, bl.T_TEXT);
		test.checkEqual(r,  result.blocks[0].inlineItems[1].text, "was");
		test.checkEqual(r,  result.blocks[0].inlineItems[1].styleFlags, bl.V_BOLD);

		test.assertEqual(r, result.blocks[0].inlineItems[2].type, bl.T_TEXT);
		test.checkEqual(r,  result.blocks[0].inlineItems[2].text, " real");
		test.checkEqual(r,  result.blocks[0].inlineItems[2].styleFlags, 0);
	});

	test.add("Parses bold on it's own", r => {
		const result = bl.parse("*amazing*");
		test.assertEqual(r, result.blocks.length, 1);
		test.assertEqual(r, result.blocks[0].type, bl.B_TEXT);
		test.checkEqual(r,  result.blocks[0].inlineItems.length, 1);

		test.assertEqual(r, result.blocks[0].inlineItems[0].type, bl.T_TEXT);
		test.checkEqual(r,  result.blocks[0].inlineItems[0].text, "amazing");
		test.checkEqual(r,  result.blocks[0].inlineItems[0].styleFlags, bl.V_BOLD);
	});

	test.add("Parses strikethrough on it's own", r => {
		const result = bl.parse("~amazing~");
		test.assertEqual(r, result.blocks.length, 1);
		test.assertEqual(r, result.blocks[0].type, bl.B_TEXT);
		test.checkEqual(r,  result.blocks[0].inlineItems.length, 1);

		test.assertEqual(r, result.blocks[0].inlineItems[0].type, bl.T_TEXT);
		test.checkEqual(r,  result.blocks[0].inlineItems[0].text, "amazing");
		test.checkEqual(r,  result.blocks[0].inlineItems[0].styleFlags, bl.V_STRIKETHROUGH);
	});

	test.add("Everything", r => {
		const result = bl.parse("_~*amazing*~_");
		test.assertEqual(r, result.blocks.length, 1);
		test.assertEqual(r, result.blocks[0].type, bl.B_TEXT);
		test.checkEqual(r,  result.blocks[0].inlineItems.length, 1);

		test.assertEqual(r, result.blocks[0].inlineItems[0].type, bl.T_TEXT);
		test.checkEqual(r,  result.blocks[0].inlineItems[0].text, "amazing");
		test.checkEqual(r,  result.blocks[0].inlineItems[0].styleFlags, bl.V_BOLD | bl.V_STRIKETHROUGH | bl.V_ITALIC);
	});
});

test.group("List", [], () => {
	test.add("Parses empty list", r => {
		const result = bl.parse("#list[]")
		test.assertEqual(r, result.blocks.length, 1);
		test.assertEqual(r, result.blocks[0].type, bl.B_LIST);
		test.checkEqual(r,  result.blocks[0].items.length, 0);
	});

	test.add("Parses list with one item", r => {
		const result = bl.parse(`#list[#dot henlo]`);
		test.assertEqual(r, result.blocks.length, 1);
		test.assertEqual(r, result.blocks[0].type, bl.B_LIST);
		test.checkEqual(r,  result.blocks[0].items.length, 1);
		testBlockIsText(r, result.blocks[0].items[0].blocks[0], "henlo");
	});

	test.add("Parses list with one item - expanded", r => {
		const result = bl.parse(`
#list[
#dot 
	henlo
]`);
		test.assertEqual(r, result.blocks.length, 1);
		test.assertEqual(r, result.blocks[0].type, bl.B_LIST);
		test.checkEqual(r,  result.blocks[0].items.length, 1);
		testBlockIsText(r, result.blocks[0].items[0].blocks[0], "henlo");
	});

	const types = [
		{ name: "Parses ul", prefix: "ul", style: bl.LS_UNORDERED },
		{ name: "Parses ol",  prefix: "ol", style: bl.LS_ORDERED   },
	];

	for (const testCase of types) {
		test.add(testCase.name, r => {
			const result = bl.parse(`
	#${testCase.prefix}[
	#dot 
		henlo
	]`);
			test.assertEqual(r, result.blocks.length, 1);
			test.assertEqual(r, result.blocks[0].type, bl.B_LIST);
			test.checkEqual(r,  result.blocks[0].style, testCase.style);
			test.checkEqual(r,  result.blocks[0].items.length, 1);
			testBlockIsText(r, result.blocks[0].items[0].blocks[0], "henlo");
		});
	}

	test.add("Parses things before and after a list", r => {
		const result = bl.parse(`
Here is the thing

#list[
#dot
	premise 1
]

See`);

		test.assertEqual(r, result.blocks.length, 3);
		testBlockIsText(r, result.blocks[0], "Here is the thing");
		test.assertEqual(r,result.blocks[1].type, bl.B_LIST);
		test.checkEqual(r, result.blocks[1].items.length, 1);
		testBlockIsText(r, result.blocks[1].items[0].blocks[0], "premise 1");
		testBlockIsText(r, result.blocks[2], "See");
	});

	test.add("Parses list within a list", r => {
		const result = bl.parse(`
#list[
#dot
	premise 1. That is because
	#list[
	#dot
		subpremise 1
	]
]`);

		test.assertEqual(r, result.blocks.length, 1);
		test.assertEqual(r,result.blocks[0].type, bl.B_LIST);
		test.assertEqual(r, result.blocks[0].items.length, 1);
		test.assertEqual(r, result.blocks[0].items[0].blocks.length, 2);

		testBlockIsText(r, result.blocks[0].items[0].blocks[0], "premise 1. That is because");

		test.assertEqual(r,result.blocks[0].items[0].blocks[1].type, bl.B_LIST);
		test.assertEqual(r, result.blocks[0].items[0].blocks[1].items[0].blocks.length, 1);
		testBlockIsText(r, result.blocks[0].items[0].blocks[1].items[0].blocks[0], "subpremise 1");
	});
});

test.group("Table", [], () => {
	test.add("Parses empty table", r => {
		const result = bl.parse("#table[]")
		test.assertEqual(r, result.blocks.length, 1);
		test.assertEqual(r, result.blocks[0].type, bl.B_TABLE);
		test.checkEqual(r,  result.blocks[0].rows.length, 0);
	});

	test.add("Parses empty table row", r => {
		const result = bl.parse("#table[#row]")
		test.assertEqual(r, result.blocks.length, 1);
		test.assertEqual(r, result.blocks[0].type, bl.B_TABLE);
		test.checkEqual(r,  result.blocks[0].rows.length, 1);
		test.checkEqual(r,  result.blocks[0].rows[0].cells.length, 0);
	});

	test.add("Parses two empty table rows", r => {
		const result = bl.parse("#table[#row #row]")
		test.assertEqual(r, result.blocks.length, 1);
		test.assertEqual(r, result.blocks[0].type, bl.B_TABLE);
		test.checkEqual(r,  result.blocks[0].rows.length, 2);
		test.checkEqual(r,  result.blocks[0].rows[0].cells.length, 0);
		test.checkEqual(r,  result.blocks[0].rows[1].cells.length, 0);
	});

	test.add("Parses one empty cell", r => {
		const result = bl.parse("#table[#row #cell]")
		test.assertEqual(r, result.blocks.length, 1);
		test.assertEqual(r, result.blocks[0].type, bl.B_TABLE);
		test.assertEqual(r,  result.blocks[0].rows.length, 1);
		test.assertEqual(r,  result.blocks[0].rows[0].cells.length, 1);
		test.assertEqual(r,  result.blocks[0].rows[0].cells[0].contents.length, 0);
	});

	test.add("Parses two rows, each with one empty cell", r => {
		const result = bl.parse("#table[#row #cell #row #cell]")
		test.assertEqual(r, result.blocks.length, 1);
		test.assertEqual(r, result.blocks[0].type, bl.B_TABLE);
		test.assertEqual(r,  result.blocks[0].rows.length, 2);
		test.assertEqual(r,  result.blocks[0].rows[0].cells.length, 1);
		test.assertEqual(r,  result.blocks[0].rows[0].cells[0].contents.length, 0);
		test.assertEqual(r,  result.blocks[0].rows[1].cells.length, 1);
		test.assertEqual(r,  result.blocks[0].rows[1].cells[0].contents.length, 0);
	});

	test.add("Parses two rows, each with two empty cells", r => {
		const result = bl.parse("#table[#row #cell #cell #row #cell #cell]")
		test.assertEqual(r, result.blocks.length, 1);
		test.assertEqual(r, result.blocks[0].type, bl.B_TABLE);
		test.assertEqual(r,  result.blocks[0].rows.length, 2);
		test.assertEqual(r,  result.blocks[0].rows[0].cells.length, 2);
		test.assertEqual(r,  result.blocks[0].rows[0].cells[0].contents.length, 0);
		test.assertEqual(r,  result.blocks[0].rows[1].cells.length, 2);
		test.assertEqual(r,  result.blocks[0].rows[1].cells[0].contents.length, 0);
	});

	const tableVariations = [
		{ 
			name: "compact",
			text: (
`#table[
#row #cell            #cell important   #cell not important
#row #cell urgent     #cell do this now #cell do this later
#row #cell not urgent #cell delegate    #cell skip
]`
			)
		},
		{ 
			name: "tree-like",
			text: (
`#table[
#row 
	#cell
	#cell 
		important
	#cell 
		not important
#row 
	#cell 
		urgent
	#cell 
		do this now 
	#cell 
		do this later
#row 
	#cell 
		not urgent 
	#cell 
		delegate
	#cell 
		skip
]`
			)
		},
		{ 
			name: "other text at the end",
			text: (
`#table[
#row #cell            #cell important   #cell not important
#row #cell urgent     #cell do this now #cell do this later
#row #cell not urgent #cell delegate    #cell skip
]

Some other text here`
			),
			totalBlocks: 2
		},
	]

	for (const testCase of tableVariations) {
		test.add(testCase.name + " - parses table with actual contents", r => {
			const result = bl.parse(testCase.text)

			test.assertEqual(r, result.blocks.length, testCase.totalBlocks ?? 1);
			test.assertEqual(r, result.blocks[0].type, bl.B_TABLE);
			test.assertEqual(r,  result.blocks[0].rows.length, 3);
			test.assertEqual(r,  result.blocks[0].rows[0].cells.length, 3);

			test.assertEqual(r, result.blocks[0].rows[0].cells[0].contents.length, 0);
			testBlockIsText(r,  result.blocks[0].rows[0].cells[1].contents[0], "important");
			testBlockIsText(r,  result.blocks[0].rows[0].cells[2].contents[0], "not important");

			testBlockIsText(r,  result.blocks[0].rows[1].cells[0].contents[0], "urgent");
			testBlockIsText(r,  result.blocks[0].rows[1].cells[1].contents[0], "do this now");
			testBlockIsText(r,  result.blocks[0].rows[1].cells[2].contents[0], "do this later");

			testBlockIsText(r,  result.blocks[0].rows[2].cells[0].contents[0], "not urgent");
			testBlockIsText(r,  result.blocks[0].rows[2].cells[1].contents[0], "delegate");
			testBlockIsText(r,  result.blocks[0].rows[2].cells[2].contents[0], "skip");
		});
	}
});
