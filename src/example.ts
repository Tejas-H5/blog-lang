export const EXAMPLE_BLOG = `

# Blog language example.

It's a lot like markdown. I can *bold* text, _italicize_ it, even put a ~line through it~ ~edit: I can't put a line through it~ 
edit: no I certainly can!

A double-newline creates a new paragraph.
However, I might want to do dot-points:
#list[
#dot
    I've tried to make my dot-points unambigous to the parser and to the writer.
    Regular dotpoints that you may have encountered would look like this:

\`\`\`md
- Bullet1
    - Sub-bullet 1
    - Sub-bullet 2
    - Sub-bullet 3
- Bullet2
- Bullet3
\`\`\`

    This is fine when they are on their own. But I've often wanted to have lots of rich content inside a dotpoint. The codeblock above, for 
    example, will obviously be contained within this dotpoint. This is made clear by the \`[]\` bracket semantics of this markup language.
    But with regular markdown, it's not so clear!

    #list[
    #dot
        Lists can also be nested.
    #dot
        They're nothing special
    #dot
        Stuff like this won't work however: \`#list []\` because of the space betwen \`list\` and \`[\`.
        I haven't found that I need it, but I can add it if people really want it.
    ]
]

Also Have you seen how bad the tables in markdown are? You need to literally do an ascii art of a table. Who's idea was that?
Here we can do tables like this:

#table[
#row
    #cell 
        *genius idea*
    #cell 
        *terrible idea*
#row
    #cell 
        no
    #cell 
        yes
]

You could write it more compactly:

#table[
#row #cell *genius idea* #cell *terrible idea*
#row #cell no            #cell yes
]

You can also put tables inside other tables if you need:

#table[
#row
    #cell
    #cell *Real*
    #cell *Fake*
#row
    #cell *Useful*
    #cell 
        #table[
        #row #cell              #cell *important*   #cell *not important*
        #row #cell *urgent*     #cell do this now   #cell do this later
        #row #cell *not urgent* #cell delegate      #cell skip
        ]
    #cell 
        Doesn't exist
#row
    #cell *Not useful*
    #cell 
        It exists, I can't think of it rn
    #cell 
        #table[
        #row #cell *genius idea* #cell *terrible idea*
        #row #cell no            #cell yes
        ]
]

Check out all my other stuff #url[here!, https://github.com/Tejas-H5]

A tangent - I keep forgetting how to do urls in markdown. Which one is valid?
#list[
#dot \`(text)[link]\`
#dot \`(link)[text]\`
#dot \`[text](link)\`
#dot \`[link](text)\`
]

Some day this will be the singular comp-sci question that comes up in a trivia night, 
where I am the only software person on the table, and I wont be able to answer it.

The order with our \`#url[]\` is dead simple to remember, because it is the same order as what you 
would think to do naturally. You know what the text for your link is, so you'll write that first.
Then you will go somewhere to get your URL.
This will backfire if you are the kind of person that copies your URL before you need it.

I'm hoping you're not that kind of person ...## Current issues

#list[
#dot We can't display code-blocks inside our code block!! DAMN!
#dot foreground color, background color styling options
#dot Tables need a way to size rows and columns, nested tables look pretty bad
#dot
    Can't render a \`]\` in the text by itself so I've had to put any mention of \`]\` inside a codeblock. Did you notice? Yeah you probably did ...
    #list[
    #dot Escape sequences aren't working in general
    ]
]
`
