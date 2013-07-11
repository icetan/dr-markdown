Dr. Markdown <b style="font-size:2em; font-weight: lighter; line-height: 0.5em; display:inline-block;">☤</b>
============

*Web based markdown editor.*

Usage
-----

Type [markdown](http://daringfireball.net/projects/markdown/) on the left and
a nice formated document will come out on the right.

You can toggle different modes by clicking in the right and left margins.

There is also a menu button in the top right corner of the left input area
where you can enable presentation/slide mode.

In the preview window on the right there are buttons at the top for showing
table of content and adding auto indexing.

Auto index can be reset or cleared by using a HTML tag with the attributes
`data-number-reset` and `data-number-clear`.

    # Not indexed
    <i data-number-clear></i>
    ## Indexing will start here

A different style or theme can be selected under `Themes` in the menu.

To get a PDF-file of your work just open your browsers print dialog and print
as PDF.

Hotkeys
-------

### General

+ `Ctrl-Alt-S` save
+ `Ctrl-Alt-Z` presentation/slide mode
+ `Ctrl-Alt-X` write mode
+ `Ctrl-Alt-C` side by side mode
+ `Ctrl-Alt-V` preview mode

### Presentation mode

+ `⟹, Space, Click` next slide
+ `⟸` previous slide
+ `Esc` exit presentation mode
