# Editing the site copy by clicking on it

A local tool for changing wording without touching HTML. You click text on the
real page, type over it, and it writes a list of your changes to a file. It does
not change the website. Claude reads that list and applies the changes properly.

The tool only exists on your machine. None of it can reach the live site.

---

## Starting it

One command, from the project folder:

    python3 tools/edit-server.py

Your browser opens on the home page with edit mode already on. That is it.
Leave the Terminal window open while you work. To stop, click that window and
press Control and C together.

If the browser does not open by itself, go to <http://127.0.0.1:8787/index.html?edit=1>.

## Using it

Everything you can edit has a faint dashed box around it. Click inside one and
type, exactly like a Google Doc.

* **Enter** finishes that edit.
* **Esc** undoes that one edit and puts the original wording back.
* **Click a photo** to change its alt text, the description a screen reader
  reads out to someone who cannot see the picture.
* Anything you change turns **orange**, so you can see your own edits at a glance.

Your edits follow you from page to page. Edit five pages, then save once at the
end. They also survive closing the browser, so you can come back tomorrow and
carry on.

## Saving

Click **Save my edits** in the black bar, or press Command and S.

That writes two files:

* `docs/copy-edits.txt`, a plain list you can read, with old wording and new wording
  side by side
* `docs/copy-edits.json`, the same thing in a form Claude can act on

Then tell Claude "the edits are saved". Claude reads the list, makes each change
in the real HTML, runs the verification tool, and shows you a before and after
screenshot of anything that moved before committing.

Saving as many times as you like is fine. Each save replaces the list with
everything you have changed so far, so nothing gets lost or doubled up.

## The buttons in the black bar

| Button | What it does |
|---|---|
| **Save my edits** | Writes your changes to the two files above |
| **Highlights** | Turns the dashed boxes off, so you can see the page as a visitor would while still editing |
| **Show locked** | Marks the text you are *not* allowed to edit, with a dotted grey box |
| **Undo all** | Throws away every unsaved edit, on every page |
| **Turn off** | Leaves edit mode so the page behaves normally again |
| **?** | Shows or hides the help line |

## Getting around

While edit mode is on, clicking a link or a button edits its label instead of
doing what it normally does. That is what stops you accidentally submitting the
booking form when you meant to reword its button.

So to move between pages, change the address in your browser: swap
`index.html` for `terms.html` and so on, keeping the `?edit=1` on the end. To
click through the site normally for a minute, press **Turn off**, or change
`?edit=1` to `?edit=0`.

## What you cannot edit, and why

Some text on the site is not really text. It is a number the page works out
while you look at it: a calculator result, a value under a slider, the countdown
to the tax deadline, the "20% rate" and "40% rate" switches. Typing over one of
those would achieve nothing, because the page would overwrite it a moment later.

The tool works out which is which by four separate tests, and anything that
fails any one of them is locked rather than editable:

1. It only offers you self-contained runs of copy. Headings, paragraphs, list
   items, link and button labels. Not sliders, dropdowns or text boxes.
2. It skips anything the page's own code refers to by name.
3. When the page loads, it compares the words on screen against the words in
   the file. If the page rewrote something while loading, it does not match, and
   it stays locked.
4. It keeps watching afterwards. If something turns out to be updated by the
   page later on, it locks it there and then.

Press **Show locked** to see what has been held back on the page you are on.
It is usually a handful of items. If something you genuinely want to reword is
locked, tell Claude and it can be changed in the HTML directly.

Titles, meta descriptions and the text search engines see are not editable here
either, since none of it appears on the page. Ask Claude for those.

## The top menu and the footer's link columns

The menu at the top and the four columns of links at the bottom are the same
on every page, so they have one home: `pension-calculator.html`. You can still
click and retype a menu label or a footer link on whichever page you are on.
Claude applies that change to the one home and runs a command that copies it
to the other twelve hand-written pages, then rebuilds the three calculator
pages, instead of making the same edit sixteen times. If one of those labels
were ever changed on a single page by hand, the verification tool would report
that page as out of step rather than let it stay different.

The small print under the link columns is not shared. Each page's legal wording
is its own, deliberately, and no tool touches it.

## Why it cannot end up on the live site

The tool never writes to your HTML files. It reads them, adds its markers to the
copy it sends to your browser, and throws that copy away. Your files are opened
read only.

Because of that, the pages that get published contain none of it. The
verification tool also checks every page for any trace of the editor and fails
outright if it finds any, so a page carrying it could not pass the checks that
run before a commit.
