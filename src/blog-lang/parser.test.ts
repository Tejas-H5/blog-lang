import * as test from "testing/testing";
import * as bl from ".";

test.file("./parser.test.ts");

test.group("Paragraphs", [bl.parseTextBlock], () => {
	test.add("Parses some text as one paragraph", r => {
		const result = bl.parse("Hello there");
		test.assertEqual(r,  result.blocks.length, 1);
		test.assertEqual(r, result.blocks[0].type, bl.Block_Text);
		test.checkEqual(r,  result.blocks[0].items.length, 1);
		test.assertEqual(r, result.blocks[0].items[0].type, bl.InlineItem_Text);
		test.checkEqual(r,  result.blocks[0].items[0].text, "Hello there");
	});

	test.add("Parses double-newline as a new paragraph", r => {
		const result = bl.parse("A\n\nHi 2");
		test.checkEqual(r, result.blocks.length, 2);
	});

	// TODO: consider preserving this space, so that the output is more representative.
	test.add("Triple newline is also fine", r => {
		const result = bl.parse("A\n\n\n\n\nHi 2");
		test.checkEqual(r, result.blocks.length, 2);
	});
})

test.group("Headings", [bl.parseBlockType, bl.parseTextBlock], () => {
	test.add("Parses Heading level 4", r => {
		const result = bl.parse("#### Hello there");
		test.assertEqual(r,  result.blocks.length, 1);
		test.assertEqual(r, result.blocks[0].type, bl.Block_Heading4);
		test.checkEqual(r,  result.blocks[0].items.length, 1);
		test.assertEqual(r, result.blocks[0].items[0].type, bl.InlineItem_Text);
		test.checkEqual(r,  result.blocks[0].items[0].text, "Hello there");
	});

	test.add("Parses Heading level 3", r => {
		const result = bl.parse("### Hello there");
		test.assertEqual(r,  result.blocks.length, 1);
		test.assertEqual(r, result.blocks[0].type, bl.Block_Heading3);
		test.checkEqual(r,  result.blocks[0].items.length, 1);
		test.assertEqual(r, result.blocks[0].items[0].type, bl.InlineItem_Text);
		test.checkEqual(r,  result.blocks[0].items[0].text, "Hello there");
	});
	test.add("Parses Heading level 2", r => {
		const result = bl.parse("## Hello there");
		test.assertEqual(r,  result.blocks.length, 1);
		test.assertEqual(r, result.blocks[0].type, bl.Block_Heading2);
		test.checkEqual(r,  result.blocks[0].items.length, 1);
		test.assertEqual(r, result.blocks[0].items[0].type, bl.InlineItem_Text);
		test.checkEqual(r,  result.blocks[0].items[0].text, "Hello there");
	});

	test.add("Parses Heading level 1", r => {
		const result = bl.parse("# Hello there");
		test.assertEqual(r,  result.blocks.length, 1);
		test.assertEqual(r, result.blocks[0].type, bl.Block_Heading1);
		test.checkEqual(r,  result.blocks[0].items.length, 1);
		test.assertEqual(r, result.blocks[0].items[0].type, bl.InlineItem_Text);
		test.checkEqual(r,  result.blocks[0].items[0].text, "Hello there");
	});

	test.add("Heading parsing works with single new line", r => {
		const result = bl.parse("# Hello\nthere");
		test.assertEqual(r,  result.blocks.length, 1);
		test.assertEqual(r, result.blocks[0].type, bl.Block_Heading1);
		test.checkEqual(r,  result.blocks[0].items.length, 1);
		test.assertEqual(r, result.blocks[0].items[0].type, bl.InlineItem_Text);
		test.checkEqual(r,  result.blocks[0].items[0].text, "Hello\nthere");
	});

	test.add("Headings seperated by single newline", r => {
		const result = bl.parse("# Hello\n# there");
		test.checkEqual(r,  result.blocks.length, 2);

		test.assertEqual(r, result.blocks[0].type, bl.Block_Heading1);
		test.checkEqual(r,  result.blocks[0].items.length, 1);
		test.assertEqual(r, result.blocks[0].items[0].type, bl.InlineItem_Text);
		test.checkEqual(r,  result.blocks[0].items[0].text, "Hello");

		test.assertEqual(r, result.blocks[1].type, bl.Block_Heading1);
		test.checkEqual(r,  result.blocks[1].items.length, 1);
		test.assertEqual(r, result.blocks[1].items[0].type, bl.InlineItem_Text);
		test.checkEqual(r,  result.blocks[1].items[0].text, "there");
	});

	test.add("Parses Heading level 1", r => {
		const result = bl.parse("# Hello there");
		test.assertEqual(r,  result.blocks.length, 1);
		test.assertEqual(r, result.blocks[0].type, bl.Block_Heading1);
		test.checkEqual(r,  result.blocks[0].items.length, 1);
		test.assertEqual(r, result.blocks[0].items[0].type, bl.InlineItem_Text);
		test.checkEqual(r,  result.blocks[0].items[0].text, "Hello there");
	});
})

test.group("Quotes", [], () => {
	test.add("Parses quote", r => {
		const result = bl.parse("> Hello there");
		test.assertEqual(r,  result.blocks.length, 1);
		test.assertEqual(r, result.blocks[0].type, bl.Block_Quote);
		test.checkEqual(r,  result.blocks[0].items.length, 1);
		test.assertEqual(r, result.blocks[0].items[0].type, bl.InlineItem_Text);
		test.checkEqual(r,  result.blocks[0].items[0].text, "Hello there");
	});
});

test.group("Code blocks", [bl.parseBlockType, bl.parseCodeBlock], () => {
	test.add("Parses code blocks", r => {
		const result = bl.parse("```\nOMG\n```");
		test.checkEqual(r, result.blocks.length, 1);
		test.assertEqual(r, result.blocks[0].type, bl.Block_CodeBlock);
		test.checkEqual(r, result.blocks[0].code, "OMG");
		test.checkEqual(r, result.blocks[0].language, "");
	});

	test.add("Parses code blocks", r => {
		const result = bl.parse("``` pl2 hey I can put anything here WTF ()@)(@!)(!*@\nOMG\n```");
		test.checkEqual(r, result.blocks.length, 1);
		test.assertEqual(r, result.blocks[0].type, bl.Block_CodeBlock);
		test.checkEqual(r, result.blocks[0].code, "OMG");
		test.checkEqual(r, result.blocks[0].language, " pl2 hey I can put anything here WTF ()@)(@!)(!*@");
	});
});

test.group("Inline code blocks", [bl.parseTextBlock], () => {
	test.add("Parses text block with a code bock in it", r => {
		const result = bl.parse("Hi `there`!");
		test.assertEqual(r,  result.blocks.length, 1);
		test.assertEqual(r, result.blocks[0].type, bl.Block_Text);
		test.checkEqual(r,  result.blocks[0].items.length, 3);

		test.assertEqual(r, result.blocks[0].items[0].type, bl.InlineItem_Text);
		test.checkEqual(r,  result.blocks[0].items[0].text, "Hi ");

		test.assertEqual(r, result.blocks[0].items[1].type, bl.InlineItem_Code);
		test.checkEqual(r,  result.blocks[0].items[1].code, "there");

		test.assertEqual(r, result.blocks[0].items[2].type, bl.InlineItem_Text);
		test.checkEqual(r,  result.blocks[0].items[2].text, "!");
	});

	test.add("Parses text starting with a code bock in it", r => {
		const result = bl.parse("`there`!");
		test.assertEqual(r,  result.blocks.length, 1);
		test.assertEqual(r, result.blocks[0].type, bl.Block_Text);
		test.checkEqual(r,  result.blocks[0].items.length, 2);

		test.assertEqual(r, result.blocks[0].items[0].type, bl.InlineItem_Code);
		test.checkEqual(r,  result.blocks[0].items[0].code, "there");

		test.assertEqual(r, result.blocks[0].items[1].type, bl.InlineItem_Text);
		test.checkEqual(r,  result.blocks[0].items[1].text, "!");
	});

	test.add("Parses text ending with a code bock in it", r => {
		const result = bl.parse("Hi `there`");
		test.assertEqual(r,  result.blocks.length, 1);
		test.assertEqual(r, result.blocks[0].type, bl.Block_Text);
		test.checkEqual(r,  result.blocks[0].items.length, 2);

		test.assertEqual(r, result.blocks[0].items[0].type, bl.InlineItem_Text);
		test.checkEqual(r,  result.blocks[0].items[0].text, "Hi ");

		test.assertEqual(r, result.blocks[0].items[1].type, bl.InlineItem_Code);
		test.checkEqual(r,  result.blocks[0].items[1].code, "there");
	});

	test.add("Parses text ending with just a code bock in it", r => {
		const result = bl.parse("`there`");
		test.assertEqual(r, result.blocks.length, 1);
		test.assertEqual(r, result.blocks[0].type, bl.Block_Text);
		test.checkEqual(r,  result.blocks[0].items.length, 1);

		test.assertEqual(r, result.blocks[0].items[0].type, bl.InlineItem_Code);
		test.checkEqual(r,  result.blocks[0].items[0].code, "there");
	});
});

test.group("Urls", [bl.parseTextBlock], () => {
	test.add("Parses singular url", r => {
		const result = bl.parse("find my blog #url[here]");
		test.assertEqual(r, result.blocks.length, 1);
		test.assertEqual(r, result.blocks[0].type, bl.Block_Text);
		test.checkEqual(r,  result.blocks[0].items.length, 2);

		test.assertEqual(r, result.blocks[0].items[0].type, bl.InlineItem_Text);
		test.checkEqual(r,  result.blocks[0].items[0].text, "find my blog ");

		test.assertEqual(r, result.blocks[0].items[1].type, bl.InlineItem_Url);
		test.checkEqual(r,  result.blocks[0].items[1].text.text, "here");
		test.checkEqual(r,  result.blocks[0].items[1].url.text, "here");
	});

	test.add("Parses link, url pair", r => {
		const result = bl.parse("find my blog #url[here, link]");
		test.assertEqual(r, result.blocks.length, 1);
		test.assertEqual(r, result.blocks[0].type, bl.Block_Text);
		test.checkEqual(r,  result.blocks[0].items.length, 2);

		test.assertEqual(r, result.blocks[0].items[0].type, bl.InlineItem_Text);
		test.checkEqual(r,  result.blocks[0].items[0].text, "find my blog ");

		test.assertEqual(r, result.blocks[0].items[1].type, bl.InlineItem_Url);
		test.checkEqual(r,  result.blocks[0].items[1].text.text, "here");
		test.checkEqual(r,  result.blocks[0].items[1].url.text, "link");
	});

	test.add("Parses link, url pair but they are strings", r => {
		const result = bl.parse("find my blog #url['\"here\"', \"'link'\"]");
		test.assertEqual(r, result.blocks.length, 1);
		test.assertEqual(r, result.blocks[0].type, bl.Block_Text);
		test.checkEqual(r,  result.blocks[0].items.length, 2);

		test.assertEqual(r, result.blocks[0].items[0].type, bl.InlineItem_Text);
		test.checkEqual(r,  result.blocks[0].items[0].text, "find my blog ");

		test.assertEqual(r, result.blocks[0].items[1].type, bl.InlineItem_Url);
		test.checkEqual(r,  result.blocks[0].items[1].text.text, "\"here\"");
		test.checkEqual(r,  result.blocks[0].items[1].url.text, "\'link\'");
	});
});

test.group("Style flags", [bl.parseTextBlock], () => {
	test.add("Parses italic inside text", r => {
		const result = bl.parse("it _was_ real");
		test.assertEqual(r, result.blocks.length, 1);
		test.assertEqual(r, result.blocks[0].type, bl.Block_Text);
		test.checkEqual(r,  result.blocks[0].items.length, 3);

		test.assertEqual(r, result.blocks[0].items[0].type, bl.InlineItem_Text);
		test.checkEqual(r,  result.blocks[0].items[0].text, "it ");
		test.checkEqual(r,  result.blocks[0].items[0].styleFlags, 0);

		test.assertEqual(r, result.blocks[0].items[1].type, bl.InlineItem_Text);
		test.checkEqual(r,  result.blocks[0].items[1].text, "was");
		test.checkEqual(r,  result.blocks[0].items[1].styleFlags, bl.STYLE_ITALIC);

		test.assertEqual(r, result.blocks[0].items[2].type, bl.InlineItem_Text);
		test.checkEqual(r,  result.blocks[0].items[2].text, " real");
		test.checkEqual(r,  result.blocks[0].items[2].styleFlags, 0);
	});

	test.add("Parses italic on it's own", r => {
		const result = bl.parse("_amazing_");
		test.assertEqual(r, result.blocks.length, 1);
		test.assertEqual(r, result.blocks[0].type, bl.Block_Text);
		test.checkEqual(r,  result.blocks[0].items.length, 1);

		test.assertEqual(r, result.blocks[0].items[0].type, bl.InlineItem_Text);
		test.checkEqual(r,  result.blocks[0].items[0].text, "amazing");
		test.checkEqual(r,  result.blocks[0].items[0].styleFlags, bl.STYLE_ITALIC);
	});

	test.add("Parses bold inside text", r => {
		const result = bl.parse("it *was* real");
		test.assertEqual(r, result.blocks.length, 1);
		test.assertEqual(r, result.blocks[0].type, bl.Block_Text);
		test.checkEqual(r,  result.blocks[0].items.length, 3);

		test.assertEqual(r, result.blocks[0].items[0].type, bl.InlineItem_Text);
		test.checkEqual(r,  result.blocks[0].items[0].text, "it ");
		test.checkEqual(r,  result.blocks[0].items[0].styleFlags, 0);

		test.assertEqual(r, result.blocks[0].items[1].type, bl.InlineItem_Text);
		test.checkEqual(r,  result.blocks[0].items[1].text, "was");
		test.checkEqual(r,  result.blocks[0].items[1].styleFlags, bl.STYLE_BOLD);

		test.assertEqual(r, result.blocks[0].items[2].type, bl.InlineItem_Text);
		test.checkEqual(r,  result.blocks[0].items[2].text, " real");
		test.checkEqual(r,  result.blocks[0].items[2].styleFlags, 0);
	});

	test.add("Parses bold on it's own", r => {
		const result = bl.parse("*amazing*");
		test.assertEqual(r, result.blocks.length, 1);
		test.assertEqual(r, result.blocks[0].type, bl.Block_Text);
		test.checkEqual(r,  result.blocks[0].items.length, 1);

		test.assertEqual(r, result.blocks[0].items[0].type, bl.InlineItem_Text);
		test.checkEqual(r,  result.blocks[0].items[0].text, "amazing");
		test.checkEqual(r,  result.blocks[0].items[0].styleFlags, bl.STYLE_BOLD);
	});

	test.add("Parses strikethrough on it's own", r => {
		const result = bl.parse("~amazing~");
		test.assertEqual(r, result.blocks.length, 1);
		test.assertEqual(r, result.blocks[0].type, bl.Block_Text);
		test.checkEqual(r,  result.blocks[0].items.length, 1);

		test.assertEqual(r, result.blocks[0].items[0].type, bl.InlineItem_Text);
		test.checkEqual(r,  result.blocks[0].items[0].text, "amazing");
		test.checkEqual(r,  result.blocks[0].items[0].styleFlags, bl.STYLE_STRIKETHROUGH);
	});

	test.add("Everything", r => {
		const result = bl.parse("_~*amazing*~_");
		test.assertEqual(r, result.blocks.length, 1);
		test.assertEqual(r, result.blocks[0].type, bl.Block_Text);
		test.checkEqual(r,  result.blocks[0].items.length, 1);

		test.assertEqual(r, result.blocks[0].items[0].type, bl.InlineItem_Text);
		test.checkEqual(r,  result.blocks[0].items[0].text, "amazing");
		test.checkEqual(r,  result.blocks[0].items[0].styleFlags, bl.STYLE_BOLD | bl.STYLE_STRIKETHROUGH | bl.STYLE_ITALIC);
	});
});

test.group("Lists and dotpoints", [bl.parseTextBlock], () => {
	test.add("Parses single list", r => {
		const result = bl.parse("#tab[Hi]");
		test.assertEqual(r,  result.blocks.length, 1);
		test.assertEqual(r, result.blocks[0].type, bl.Block_List);
		test.assertEqual(r,  result.blocks[0].blocks.length, 1);
		test.assertEqual(r, result.blocks[0].blocks[0].type, bl.Block_Text);
		test.assertEqual(r, result.blocks[0].blocks[0].items[0].type, bl.InlineItem_Text);
		test.assertEqual(r, result.blocks[0].blocks[0].items[0].text, "Hi");
	});


	// Different ways of formatting the same thing:
	const cases = [
		`
		#dot[
			OMG
			#dot[ OMG2 ]
			#dot[ OMG3 ]
			Omg4
		]
		`,
	];

	cases.forEach((testCase, i) => {
		test.add("Parses list of list of bullets case " + (i + 1), r => {
			const result = bl.parse(testCase);

			test.assertEqual(r, result.blocks.length, 1);

			const dotpoints = result.blocks[0];
			test.assertEqual(r, dotpoints.type, bl.Block_Dot);
			test.assertEqual(r, dotpoints.blocks.length, 4);

			testEqualBlockOfText(r, dotpoints.blocks[0], "OMG");

			test.assertEqual(r, dotpoints.blocks[1].type, bl.Block_Dot);
			testEqualBlockOfText(r, dotpoints.blocks[1].blocks[0], "OMG2");

			test.assertEqual(r, dotpoints.blocks[2].type, bl.Block_Dot);
			testEqualBlockOfText(r, dotpoints.blocks[2].blocks[0], "OMG2");

			testEqualBlockOfText(r, dotpoints.blocks[3], "OMG");
		});
	});

	test.add("[debug]Parses text after a list", r => {
		const result = bl.parse(`#dot[hi] there`);

		test.assertEqual(r, result.blocks.length, 2);
		test.assertEqual(r, result.blocks[0].type, bl.Block_Dot);
		test.assertEqual(r, result.blocks[0].type, bl.Block_Dot);
	})
});

function testEqualBlockOfText(r: test.Result, val: bl.Block, text: string): asserts val is bl.TextBlock {
	test.assertEqual(r, val.type, bl.Block_Text);
	test.assertEqual(r, val.items.length, 1);
	test.assertEqual(r, val.items[0].type, bl.InlineItem_Text);
	test.checkEqual(r, val.items[0].text, text);
}

test.group("Tables", [bl.parseTextBlock], () => {
	test.add("Parses table with a cell", r => {
		const result = bl.parse(
			"#table[\n" +
			"#row\n" +
			"	#cell A\n" +
			"	#cell B\n" +
			"#row\n" +
			"	#cell C\n" +
			"]\n"
		);

		test.assertEqual(r, result.blocks.length, 1);

		test.assertEqual(r, result.blocks[0].type, bl.Block_Table);
		test.assertEqual(r, result.blocks[0].rows.length, 2);
	});
})

