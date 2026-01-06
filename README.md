# Anchor Link Display Text

This is a plugin for [Obsidian](https://obsidian.md) which automatically sets the display text of anchor links.

## What's New in v1.4

### Added

- Option to use a file property instead of the note name.

## Description

This plugin automatically sets the display text of anchor links (links to a heading of another note) to be the name of the heading instead of showing the link text as it appears. So, instead of:

``` Markdown
[[Title#Heading]]
```

The link will automatically update to:

``` Markdown
[[Title#Heading|Heading]]
```

This provides a nicer appearance while saving the time of manually setting the display text, especially if you use tab to autocomplete the link, because when you autocomplete, you have to navigate back in front of the brackets, add the vertical bar, and then type the heading name.

## Features

The goal of this plugin is to be useful for regardless of one's personal note taking style. That is why in the settings you can specify the format of the display text:

``` Markdown
Just the heading (default): [[Title#Heading|Heading]]
The heading followed by the note name: [[Title#Heading|Title Heading]]
The note name followed by the setting: [[Title#Heading|Heading Title]]
```

This plugin works the same way for anchor links containing multiple headings. This behavior can be changed too:

``` Markdown
Show all headings (default): [[Title#Heading#Subheading#Subsubheading|Heading Subheading Subsubheading]]
Show only the first heading: [[Title#Heading#Subheading#Subsubheading|Heading]]
Show only the last heading: [[Title#Heading#Subheading#Subsubheading|Subsubheading]]
```

By default, the headings in the display text will be separated by a single space, but this can be changed to whatever you prefer. Some examples may be a comma (, ), colon (: ), or arrow (-> ). Just note that whatever is typed in the separator text box in the settings will be exactly what is used in the display text, nothing is added to it or removed from it, with the exception of characters which will break links: `[]|#^`.

Additionally, there is an option for enabling display text alternative suggestions. This is a suggestions window which will appear when the cursor is next to an existing anchor link. All three display text formats described above will be available as suggestions regardless of the option chosen for automatic display text generation. This is useful for users who wish to use multiple formats.
