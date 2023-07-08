# hex
## What is this?
**hex** is an application originally designed to create learning activities, similar to Hot Potatoes. In fact, **hex** has the capability to turn any tab-formatted table into webpage-based activities (so using HTML, CSS and Javascript). In future versions, it will be possible to create your own activities.

So far there are four activities available: Blockbusters, Match, Crack the code and Backs to the board.

## How do I use it?
The simplest way is to simply copy and paste a list of vocabulary (with translation or definitions) from a Word or Excel document into **hex**. You can press *run* to open the activity, probably for use in the classroom, or you can press *export* to create an HTML file (or SCORM file). You can then put this HTML file on a Learning Management System, like Moodle, so that your students can use them individually. Some activities work best in the classroom, like *Backs to the board*. Others, you’re more likely to use as individual activities, like *Match*, either in a computer lab or at home. 

## How do I get it?
Find the latest version under **Releases** on the right-hand side.

## Why is it called **hex**?
The first activity I made was the Blockbusters activity, which uses hexagons. Hexagons are very cool – they're the most-sided regular polygon that tessellates. Also a bit of an hommage to Terry Pratchett.

## Why on earth did you make this with Electron?
If I were making this just for myself, I would have made it easier for myself and just done something on the command line. Since I wanted to be able to share it, I needed a way to make a graphical application quickly for multiple platforms. Since **hex** exports HTML files (and therefore needs browser-capability in order to use them in run mode), Electron had all the features I needed baked in. Since it does very little heavy lifting, the resource cost of using Electron is relatively low. Also, unlike other Electron apps, it’s not acting as a front for what is essentially a website – **hex** works entirely offline.

## What’s next for **hex**?
- Improved custom activities support.
- Explanations on how to use each activity.
- SCORM support for all activities.
- Import data from previously exported activities.
- New activities: Double Puzzle, Cards, Magnet Board, Sort, Timeout, Codenames, Four-in-a-row, Spinner, Climber, Odd One Out.

## Disclaimer
I am not a software developer, I am an English teacher. A huge part of this project is copy and pasted code (that I try to remember to give my source for, but often forget in the folly of trying out new things – I will try to add more attributes in future versions) and pure guess work.