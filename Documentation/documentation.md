 # hex documentation

## Installation
**hex** is available as a .dmg for Mac and .exe for Windows. Download the installation file for your computer, open and follow the instructions.
There's no build for Linux distributions yet, but you're welcome to build it yourself from the source files.

## Usage

### Activity selector
Select the activity you wish to create. This will automatically add the number of required columns (and remove any unnecessary blank ones).

### Table editor
The easiest way to use **hex** is to paste in lists of words/phrases/definitions/etc. from another application. It must be tabbed data (rows on a new line, columns separated by tabs). But most applications that use tables (including Microsoft Word and Excel) will copy and paste as tabbed data without having to do anything special. Then, click on the first cell (or any cell below) and press Ctrl+V / Cmd+V, or right-click and select **Paste**.

You can also enter data and edit it directly within **hex**. The plus/minus buttons (which appear when hovering over a column header or row number) allow you to add and remove columns and rows (also alt+tab to add a column, alt+shift+tab to remove it). The ↔︎ icon lets you swap data between two columns, which is useful when making several activities where the column headers won't necessarily correspond. Click on a row number or column header to select that row or column. Hold down shift to select multiple sequentially, or ctrl/command to select multiple out of sequence.

Columns that are greyed out are still editable, but won't be used for the currently selected activity.

Some activities have optional columns. When this is the case, the heading will be in parentheses. These columns will not necessarily show automatically, you may need to add them yourselves. Some activities accept an infinite amount of optional columns (e.g. Falling Words).

#### <a name="expand-view">Expand view</a>
Click on ⋮ on a table cell to expand the cell, or ⋮ in the column header to expand all the cells in that column. In an expanded cell, you can add new lines, which will be displayed in activities that support multiline data. When returning to the non-expanded view, new lines will be converted to `\n`, but this should be converted back to a new line in an activity. You can also type this directly in the non-expanded view to add a new line. This view is also useful for cells containing a lot of data.

#### Add images
Some activities support images in one or more column. When images are supported, you can either drag and drop the image to a cell, or expand it (see [the section above](#expand-view)) and click the image button. Some activities may accept both text and images. In expanded view, when no text has been entered, the text box is hidden in order to show the image in a larger size.

#### Remove images
In the standard view, click on the image you wish to delete. A X button will appear. Click on the button to confirm deletion.

In expanded mode, hover over the image you wish to delete. A translucent X button will appear. Click on the button once to make it opaque and a second time to confirm deletion.

#### Exporting the table
To save your table somewhere else: Tools → Export table as tabbed text / Export table as JSON.

### Activity settings
Open the activity settings drawer to adjust any available settings for the selected activity. As a minimum, each activity should have an "about" section which will explain how the activity works, and an "example" button, which will fill in the table with some sample data. This way, if you're not sure how an activity works, you can run it straight away with the example data and try it out yourself before putting in your own data.

Other settings may include, color options, sound controls, difficulty levels and options to custom certain labels in activities (which is useful if you don't want your activity to be in English). More details in the Activities section.

You can the change the defaults for activity settings by selecting this option in the tools menu. Otherwise, these will be reset every time you re-open the app or when you change activity. If you want to restore the original defaults, choose **Reset current activity settings to factory** in the menu. 

### Run
Clicking on **Run** will open the selected activity in a new window, using the data from the table and the activity settings. You can reset any activity with the shortcut Ctrl+R or Cmd+R on a Mac. If you make any changes to the data in the table, you will need to close the activity window and press run again to see these changes in the activity. This means that you can run as many activities as you like with the same or with different sets of data.

You can also export the activity from the menu while running it.

See the section [Errors on run or export](#Errors-on-run-or-export) for any errors.

### Export
Clicking on **Export** will open a dialog to save an HTML page. This page will open in any modern browser and allow you to run this activity any time. You can also upload this page to a website or add to a Moodle page (see the section [Adding to Moodle](#Adding-to-Moodle).

The exported file contains everything the activity needs to run, including styles, scripts, fonts and images. This is not typical for an HTML page (normally the best practice is to store components separately). However, this makes it much simpler to manage activities and add them to other websites or LMS (Learning Management System). Very large **hex** activities may take a long time to load and the application has not been tested with datasets of more than about 200 rows. 

#### Exporting SCORM
You can also export SCORM packages for some activities. You will need to first show the advance export options (**View** → **Advanced export options**). You can then switch from HTML to SCORM. When exporting, you will be able to save a ZIP file (the format used for SCORM packages).

SCORM packages have a unique identifier to be distinguished by the LMS (Learning Management System, such as Moodle). If you want to be able to update your package later, you should keep a copy of the automatically generated identifier. This appears in the **id** box and is also shown when exporting. When producing a new version of the same SCORM package, you should paste the identifier in the **id** box. If you export with a new identifier, the LMS will consider this a new package and learner information associated with this package may be lost. You can also use whatever you want as an identifier (“banana” for example would work, though it is recommended to have something a bit more unique). However, you should not reuse the same identifier for two packages on the same course, as the LMS will not be able to distinguish them.

If you're worried about accidentally generated two identifiers that are the same: don’t. When you export without an identifier or click on the dice button **hex** makes a UUID. Wikipedia has this to say about UUIDs:
> Only after generating 1 billion UUIDs every second for the next 100 years, the probability of creating just one duplicate would be about 50%. Or, to put it another way, the probability of one duplicate would be about 50% if every person on earth owned 600 million UUIDs.

The SCORM packages generated by **hex** typically provide a score between 0 and 100 (essentially a percentage) and also try to save progress if a user exits an activity before finishing it. It also saves some interactions so you can get an idea of what a learner actually did in the activity and how long they spent doing it. This makes it much more appropriate for tracking learning. However, please bear in mind that SCORM packages are not appropriate for testing, especially without surveillance. Both **hex** activities and the SCORM API use Javascript, which can be manipulated relatively easily in any browser by opening the Javascript console.

At the moment, exporting as SCORM is available for the **Angram**, **Blockbusters**, **Cloze**, **Crack the code**, **Four in a row**, **Match** and **Word order** activities.

#### <a name="Adding-to-Moodle">Adding to Moodle</a>
In edit mode, simply drag and drop the exported file onto the Moodle page. For SCORM packages, you will need to select this type in the pop up. Alternatively, click the **Add a new activity or resource** button, select either File or SCORM package and then upload the **hex** activity.

You may want to adjust the Appearance settings after upload. I would recommend changing **Display** to **New window** for most activities, but you may want to do **Embed** or **In frame** for some smaller activities to make it easier for students to navigate around your page.

### <a name="Errors-on-run-or-export">Errors on run or export</a>

#### [Activity] requires X row(s) and you only have Y row(s)
You have no entered enough data for this activity to run. You will need to add some more rows to the bottom.

#### [Activity] requires X columns(s) and you only have Y column(s)
You have not filled in all the required columns. Optional columns are in brackets.

#### [Activity] does not allow empty cells and you have X empty cell(s)
You have left some cells empty. These should be highlighted in red. Check to see if you have an empty rows in the middle and delete them.

### Activities

#### Anagram
This activity shuffles the letters of the answers to create anagram puzzles. You can have as many puzzles as you like, but it's a good idea to do fewer than twelve. You an optionally give a clue (you can think of this as the question that the learner needs to find the answer to). 

Anagram will try to avoid creating anagrams containing potentially offensive words in English and in French. However, please be aware that it will not refuse to create an anagram if it fails to generate a non-offensive one.

##### Activity settings
- **Color**. There are a number of color themes to choose from.
- **Questions limit.** Set to 0 shows all questions, otherwise shows a random number of questions as specified.
- **Check button label**. Customise text on check button.

##### Examples
- British foods.

#### Backs to the board
This activity is for use in class, probably with the whole group. The class is split into two teams. A team leader is elected from each. They stand at the front, either side of the teacher with their backs to the boards. The teacher will probably want to face the board or else sit on a swivel chair so they can quickly look round. A list of words will be shown on the board and the two teams must explain (in the target language only!) the words to their own team leader *simultaneously*. This is not a game where the two teams take it in turns, so it can get a little noisy. When the team leader knows a word, they say in quietly to the teacher, who will tick it off from their side. When a team has found all the words, they win. The team leader can then be changed.

Of course, there is a risk that the team leader will hear a clue intended for the other team. However, in reality, this is rarely an issue, as they are usually focused on their own team. 

In someone *does* try to cheat (saying the word in their own language, telling the team leader the word, the team leader looking at the board…), there is a penalty button. This will add another word from the list, which only the offending team needs to get in order to win.

Some variations are possible. For example, miming instead of explaining words, the whole class explaining to both leaders (who are in competition), one explainer for each team (change after each word)…

##### Activity settings
- **Color**. There are a number of color themes to choose from.
- **Shuffle**. Show the words in a random order.
- **Re-use words between games**. When disabled, the game will avoid showing words from a previous round when resetting. When enabled, the game can show words from the previous round.
- **Show penalty buttons**. You can hide these if you'd prefer to keep things simple.
- **Sounds**. Sound effects can be disabled.

##### Examples
- Basic verbs.

#### Blockbusters
This activity can work as a whole class in teams or with individuals on their own devices (though a mobile phone screen is a little too small). This is an old gameshow concept. The first team must try to connect the left-hand side to the right-hand side. The second team must connect the top to the bottom. They can choose any free hexagon in any order. The first team has further to go, but they get to start, which makes it more-or-less fair. In order to win a hexagon, they must answer a question. A clue for the answer is given in each hexagon (the initials). When they think they know the answer, click on **Show answer**, then **Correct** or **Wrong** depending on what they had said. It's usually a good idea to play at least one game as a whole class first, otherwise students can mistakenly think that this is a true/false exercise and don't realise they need to supply their own answer before looking at the correct one.

##### Activity settings
- **Color**. There are a number of color themes to choose from.
- **Sounds**. Sound effects can be disabled.
- **Show clues**. To make it harder, the initials of the answer can be hidden.
- **Wrong answer behaviour**. In the default setting, when a team answers incorrectly, the opposing team automatically gets their hexagon, which sometimes causes them to win. The alternative option is to remove that hexagon from the game and no one can win it. This can make the game go on much longer.
- **Team builder**. Show a screen at the beginning to write the names of the team mates. These will be shown at the bottom of the screen during their corresponding turns. This is mostly intended for SCORM packages (for which it is always enabled).
- **New game button**. Customise the wording.
- **Start game button**. Customise the wording.
- **Show answer button**. Customise the wording.
- **Correct button**. Customise the wording.
- **Wrong button**. Customise the wording.

##### Examples
- European capitals.
- Jobs.
- Comic book Superheroes.

#### Cards
Shows one or many cards on the screen. According to the settings, cards can be turned over or shown on just one side. Cards can be dealt by clicking on the deal button or by clicking on the deck. Turn the card over by clicking on it. Hover over the top of the card to reveal the discard button and on the bottom of the card to reveal the button to return a card to the deck. The … icon at the top reveals extra controls to apply to all cards at once or to restore discarded cards. This is a flexible activity with no set aim and can be used in many different circumstances, including memorization, choosing random items or for simple games. The back of the card is optional.

##### Activities settings
- **Color**. There are a number of color themes to choose from.
- **Deal cards**. Default face to show when dealing.
- **Allow flip cards**. When disabled, cards will be shown in their default position and cannot be turned over.
- **Maximum cards at once**. Set to 0 for no maximum. Otherwise, this stops the user from drawing more than this number of cards.
- **Discard style**. Changes only appearance and animations. Trash will show a trashcan icon when hovering over the top of the card, where OK will show a checkmark on either or both sides of the card. Use trash for when discarding is simply to remove the card from the game. Use OK when discarding signifies that the card has been ‘complete’, which can be set for only one side of the card. When set to just one side, the button will always show.
- **Deal cards**. When enabled, discarding a card triggers a new one to be dealt.

##### Examples
- Jobs.
- Fruit (in French and English).
- 
#### Climb
The user is a sprite, flying upwards. As they fly, they will past questions, the learner must find the answer before they disappear in order to gain energy and keep moving. When the sprite runs out of energy, the game is over, except in **Very easy** mode where there is no energy bar. Both typing and multiple choice modes. 

##### Activity settings
- **Color**. There are a number of color themes to choose from.
- **Theme**. Sets a number of other settings to a preset in order to create the overall style of the game. Select custom to change the individual elements.
- **Background**. Background image. Can accept imported images, which are recommended to be SVG files for the best appearance and performance. The file should also be able to repeat vertically.
- **Overlay (vertical)**. A foreground element that moves in a gradual diagonal across the screen. Can accept imported images, which should be mostly transparent and able to repeat both horizontally and vertically.
- **Character** The image used for the sprite. Can accept imported images. 
- **Character (accelerating)** The image used for the sprite just after a correct answer is given. Choose **no change** to use the main image in this instance. Can accept imported images. 
- **Character (game over)** The image used for the sprite just before a game over. Choose **no change** to use the main image in this instance. Can accept imported images. 
- **Shuffle**. When disabled, questions will drop in the order givoii9en.
- **Sounds**. Sound effects can be disabled.
- **Mode**. Typing or multiple-choice. In typing mode, learners can give as many guesses as they can before the word reaches the bottom or the top of the pile. In multiple-choice mode, they only have one guess, after which the question will immediately drop to the bottom.
- **In multiple choice mode, maintain the same options every time a question reappears**. When enabled, this will always show the same possible answers in the same order for each falling word. Wrong answers will be selected according to their similarity with the correct answer. The range of answers may not be the same from game-to-game. Always enabled if there four or fewer possible answers.
- **Difficulty**. Choose between Very easy, Easy, Medium, Hard, Ultra and Impossible. This varies the speed at which questions fall and the relief time between each question.
- **Required similarity to accept answer (%)**. Typing mode only. Difference between submitted answer and all possible correct answers. If the words are sufficiently similar, the answer will be accepted, but with a difference message and sound.
- **Loop**. Forever, Missed words first, Missed words only, Off. In order for the player to be able to complete the game, select **Missed words only** or **Off**.
- **Guess button**. Customise the wording.
- **Correct answer message**. Customise the wording.
- **Acceptable answer message**. Customise the wording.
- **Incorrect answer message**. Customise the wording.
- **Start instruction**. Customise the wording.
- **Winning message**. Customise the wording.
- **Losing message**. Customise the wording.
- **Abandon game confirmation**. Customise the wording.
- **Reset button**. Customise the wording.
- **Show answers instruction**. Customise the wording.
The following settings are repeated five times to allow for up to five different decoration elements.
- **Falling decoration _n_**. Image for decoration. Can accept imported images.
- **Min size (_n_)**. Minimum size of decoration, 1-100. A random size will be chosen each time the decoration appears between the minimum and maximum. For a consistent size, set these to the same number.
- **Max size (_n_)**. Maximum size of decoration, 1-100.
- **Min depth (_n_)**. Minimum depth of decoration, -100-100. A random depth will be chosen each time the decoration appears between the minimum and maximum. For a consistent size, set these to the same number. The number 0 represents the same depth as the sprite. Higher numbers will have a greater depth effect applied - a smaller size and blurring, as well as a slower fall speed. Minus numbers will appear larger and in front of the sprite, as well as in front of the falling questions.
- **Max depth (_n_)**. Maximum depth of decoration, -100-100.
- **Speed (_n_)**. Speed at which the decoration falls. Set to 0, decorations will fall at the same speed as questions, not taking into account depth. 0-100.
- **Rotation variation (_n_)**. Decorations will be rotated between 0 and this degree randomly. 0-360.
- **Hue variation (_n_)**. Decorations will be recolored randomly by between 0 and this percent compared to their original color.
- **Spin (_n_)**. Spin animation béhaviorismes.
- **Drift (_n_)**. Horizontal movement of the decoration.
- **Flip (_n_)**. When enabled, the decoration has a 50:50 change of being flipped, according to the setting.

Note that further animations can be introduced to sprites and decorations by using GIFs or animated SVGs, as is the case with a number of the stock elements.

#### Crack the code
Letters in the answer are replaced with a random emoji. To find the answers, the letter each emoji represents must be supplied. Optionally, a clue can be given (this could be the definition or a translation of the word). This works best with short lists of words, since a long list will reveal all the answers before reaching the end.

##### Activity settings
- **Color**. There are a number of color themes to choose from.
- **Difficulty**. Easy – 5 letters are given. Medium – 3 letters are given. Hard – no letters are given.
- **Questions limit.** Set to 0 shows all questions, otherwise shows a random number of questions as specified.
- **Check button label**. Customise text on check button.
- **Symbols**. Choose which category of emoji to use for the game. Set to custom to include multiple categories at once. 
- **Game code**. Run the activities multiple times (or press Ctrl+R or Cmd+R to reload). When you have a set of symbols you like, press the button in the top-right corner and copy the code. Pasting that code here will reproduce the same set of symbols every time.
- **Show game code button**. Enable this first or order to access the game code. It is recommended to disable this before exporting.

##### Examples
- Fruit.

#### Cloze
Create a cloze (fill in the blanks) exercise which can be answered either by typing, by multiple choice dropdown or with drag-and-drop elements.

Each line of the table represents a sub-exercise in the activity and so each line can contain multiple cloze elements, which are all typed in the first column. For a type-in cloze, enclose the words to type in with [square brackets]. For multiple choice, enclose all the possibilities in less than (<) and greater than (>) signs and use a pipe (|) to separate answers, with the correct answer indicated using the equals sign (=). For example: `<=Correct answer|Wrong answers|Another wrong answer>`. Finally, a drag-and-drop cloze can be created using {curly brackets}. By default, the answers are contained in a shared bank for the entire activity.

For type-in and drag-and-drop cloze, ~ can be used to indicate another acceptable answer. For type-in cloze, this means the answer will not be revealed as a correct answer, but will be accepted nonetheless. For drag-and-drop cloze, this means the answer will be accepted, but a drag-and-drop element will not be created, therefore it will only be possible to add this answer if another element has it as a possible option. In this way, it's possible to make two drag-and-drop cloze items where the answers are exchangeable. For example, in `Bananas are [tasty|yellow] and [~tasty|~yellow]`, the drag-and-drop elements are created for the first cloze, but can both be placed into the second cloze, without creating a duplicate element. Another way to achieve a similar result is to enable the infinite bank option, though this adds a layer of difficulty for the learner.

The optional second column is for prompts, which will appear above each line. The optional third column is for hints, which are shown by default, but can be hidden until a condition is met in the activity settings. Trap answers for drag-and-drop cloze can be added in the fourth column, each separated with a comma or a semi-colon. This activity supports markdown formatting.

Blank lines can be added to create a space between sub-exercises.

|Symbols|Usage|Example|
|---|---|---|
|[…]|Typing cloze|`You must type an [answer] into the space.`|
|<…>|Multiple-choice cloze|`Choose the <=correct\|wrong> answer.`|
|{…}|Drag-and-drop cloze|`Drag an answer into this {space}.`|
|\||Separate possible answers.|`This [text\|typing] box accepts multiple answers. You can also {drag\|place} two different answers in this box.`|
|=|Indicate correct answer for multiple-choice|`Choose an [=answer\|banana]`|
|~|Indicates hidden answer (typing and drag-and-drop only)|`Here is the [answer\|~response]. It will accept two, but only one will be revealed if the correct answer is not found.`|

**Note for advanced users:** For type-in clozes, it's possible to use Regular Expressions to accept a multitude of possible answers without typing in every possible combination. To do this, enclose the Regular Expression in two forward slashes (/). It's recommended to do this as a second possible answer, with the first being a “model answer”, otherwise if a learner presses the *reveal answers* button, they will only see a blank box. For example `[Model answer|/.+model answer.+/]` will accept both “Model answer” and any answer that contains those two words. As another example, `[Banana(s)|/[bB]ananas?/]` will accept “banana”, “Banana”, “bananas” and “Bananas”, as well as the first answer “Banana(s)”.

##### Activity settings
- **Color**. There are a number of color themes to choose from.
- **Font**. You can change the typeface here.
- **Font size (%)**. 1-500.
- **Drag-and-drop bank**. Whole activity or per line. Per line should only be used when each line contains more than one drag-and-drop cloze, or at least one trap if there is only one.
- **Items in bank can be reused**. When enabled, any duplicate items are hidden in the word bank. Each item in the word bank can be used multiple times. This can make activities where some words are repeated more difficult, as the learner won't know how many of each item they will need.
- **Lock correct answers**. This prevents learners from changing an answer if it has already been marked as correct using the check button.
- **Minimum attempts**. If set to 0, this has no effect. If set higher than 0, a ‘Show answers’ button will appear after the minimum number of attempts has been reached. This can also be set as the threshold for showing hints.
- **Maximum attempts** If set to 0, this has no effect. If set higher than 0, users will not be able to answer after they have reached this number of attempts.
- **Check sentences**. Learners can check all items at once, or per line.
- **Score calculation**. Either each cloze is worth one point or each line (containing at least one cloze) is worth one point.
- **Hints shown**. Options to show hints when a condition is met.
- **Attempts text**. Customise the label for the number of attempts.
- **Show answers text**. Customise the label for show answers button
- **Score text**. Customise the label that appears before the score.
- **Completion % (scorm only)**. The percentage of correct answers for the activity to be recorded as completed in the LMS. Has no effect when using the activity in **run** mode or when exported as HTML.

#### Crossword
Create a crossword puzzle from the answers and clues. In most cases, not all words will be used, a better puzzles are usually generated by supplying a longer list of possible answers and clues. Every time the activity is loaded, a new puzzle will be generated. However, you can reuse the same puzzle again by clicking on the button in the top-right corner and copying the game code into the activity settings. This will force the activity to create the same puzzle every time. The code for generating new crosswords is not especially fast.

##### Activity settings
- **Color**. There are a number of color themes to choose from.
- **Grid size**. You can make larger and smaller crossword puzzles. However, unless you have very long words, this is actually not very likely to change the outcome of the algorithm that generates the puzzles.
- **Pre-fill answers**. See the answers in the grid. This is useful while trying to generate a particularly good puzzle.
- **Fast generation**. Generates puzzles more quickly, but usually with fewer words. More appropriate for smaller sets of words. Has no impact when using a game code.
- **Game code**. Copy the code from the activity to always reproduce the same puzzle.
- **Show game code button**. You can hide the game code button, for example if you think it might cause curious students to waste time.

##### Examples
- Education

#### Decisions
This activity creates a simple create-your-own-adventure type game. It's quite different from most of the other activities in **hex**, but somewhat similar to **treasure hunt**. Each question is shown individually, with one-eight answer options  underneath. Clicking on an answer will take the learner to the question referenced by the index (the index is shown in hex by the numbers on the left-hand side). These sorts of games can be complex to map out, so it will be a good idea to plan this in a tree diagram before attempting to make it in hex.

##### Activity settings
- **Color**. There are a number of color themes to choose from.
- **Winning indices**. Specify which index or which indices should show confetti. You can write your own winning message for the Question on these indices. The answer button is not optional, but you can simply put “Try again?” and give 1 as the index.
- **Losing indices**. Specify which index or which indices should show the losing animation. You can write your own game over message for the Question on these indices. The answer button is not optional, but you can simply put “Try again?” and give 1 as the index.
- **Losing effect**. The animation that will play when arriving at a losing index. To disable, simply do not specify any losing indices.
- **Sounds**. Sound effects can be disabled.

##### Examples
- A single-question win-or-lose game.
- The Intern

#### Drill
An activity for individual use to start learning vocabulary. In default mode, each piece of vocabulary passes through the following stages: listen and repeat (back-drilling), read and rewrite (back-drilling), read and rewrite, say the world aloud from memory, rewrite from memory. For each item at each stage, the learner can decide to move on to the next step (so long as they have fulfilled the criteria for completion) or review the item again, in which case they will go back up to two stages. Back-drilling happens automatically for phrases; the final word is presented first, following by the final two words and so on until the whole phrase has been built. For words, back-drilling will be used when the words are split up by the activity creator (by default using **/**). The activity uses the speech synthesis of the device it is run on, therefore the appropriate languages must be installed by the learner for this to work correctly. In the fourth column, you can override how the speech synthesis pronounced a word by writing it in whatever way obligates the speech synthesis to say it correctly. To provide a speech synthesis for individual parts, put this in [square brackets], with the same separators as in the Word/Phrase column.

##### Activity settings
- **Word separator**. Choose the character to separate longer words into shorter ones.
- **Language for speech synthesis**. The language to offer voices from when running the activity. For some languages, you can choose both the overall language or a dialect. Bear in mind that not all devices will have all languages available. The quality of voices may vary from device to device and depending on the version of the users' operating system.

##### Examples
- Debate language (French to English).
- Basic English words.

#### Escape game
Create a map for an escape game. This template can either be used for a self-contained activity, or the central part of a multi-activity lesson. Each section on the map contains a question. When the learner inputs the correct section, it is unlocked. When either all the sections are unlocked or when specific sections are locked, the learner win the game. The table for this activity has many columns, most of which are optional. The **section** column accepts text or an image which will be shown on the grid that forms the map, in the order listed (from left to right, top to bottom). The **question** column takes text which will be shown when clicking on the section and the **answer** column  takes the text that the learner must enter in order to complete this section. The optional **req. similarity %** column allows you to customize how precise the learners need to be when typing in their answer (e.g. a similarity of 90 would mean that a ten-word answer would be accepted if just one letter was incorrect). The optional **req. indices** column allows you to specify the index (number shown on the left-hand side of the table) of as many other sections as you wish, which must be completed before this section appears. The optional **completion message** allows you to provide text which will appear in a pop-up message box when completing this section (if blank, no message box will appear). The **unlocked section** column accepts text and images and will be shown in place of whatever is specified in the first column, after the section has been completed. If left blank, the section will remain the same on the map (though there are some effects that can be applied to all completed sections, which can be enabled in the activity settings.) The **hint** column allows you to provide a secondary question to help the learners, which will appear by default after the first attempt, but this can be customised in the activity settings. Finally, all subsequent columns take alternative answers, which will be accepted as the main answer with the same degree of required similarity (if this is provided). This activity includes three examples with pre-configured settings. These could also be used as templates for your own escape game activity. 

##### Activity settings
- **Theme**. Pre-fills several other settings to create a coherent theme for a number of presets.
- **Background**. Background color or image for the map. Accepts imported images. It is recommended to use SVG if possible and a resolution of 1280x720.
- **Color scheme**. Color scheme for user interface.
- **Font**. Choice of font face.
- **Question box**. Different styles for the question box pop up.
- **Load animation**. How elements will appear when opening the map and moving between different sections.
- **Hover animation**. Animation for when hovering the mouse over a section.
- **Completed section**. How the section will look when the answer has been given. This can be further customised in the optional *Unlocked section* column in the main grid.
- **Width of grid compared to background (%)**. In order to allow for a margin around the edge, this indicates how wide the grid that contains all the sections should be.
- - **Width of grid compared to background (%)**. To alter the height of the grid.
- **Tint sections with foreground color**. There are two methods of tinting available which can be used to create a more consistent look across the different sections, even if the images used employ different color schemes.
- **Number of columns**. How many columns to use in the grid layout of the map. The number of rows is calculated automatically.
- **Case sensitive**. If disabled, learners will need to input the answer with the same upper and lower case letters as it is given.
- **Default required similarity to accept answer**. If less than 100%, slightly different answers can be accepted. This can be customised per section using the optional columns in the main table.
- **Show hint**. When the learners will see any hints (given in an optional column of the main table).
- **Unlock all sections to win**. Winning message will be shown only after all sections with questions have been answered.
- **Index of section to win**. Learners can win by answering just one question. By filling in the required indices in the optional column for this section, you can ensure that learners have answered some other questions before being able to win.
- **Instruction per question**. Customise the wording of the input box for the question box pop-up. In this option, use the wildcards to represent numbers and to form plurals. **%w** stands for the number of words, **%c** stands for the number of characters. **%s[]** is used to signal a plural ending, by default %s[s]. The character(s) in brackets will be shown when the last number in the string is above one. For example, the default “Enter %w word%s[s] (%c character%s[s]).“ will be rendered something like “Enter 1 word (10 characters).” for a single word answer of 10 characters.
- **Message box button label**. Customise the wording for this button.
- **Question box button label**. Customise the wording for this button.
- **Correct answer message**. Customise the wording for when the correct answer is given.
- **Acceptable answer message**. Customise the wording for when the answer is accepted due to the *required similarity* parameter.
- **Incorrect answer message**. Customise the wording for when the incorrect answer is given.
- **Starting message**. Unless left blank, a message box will appear when opening the map with this text.
- **Winning message**. Unless left blank, a message box will appear when completing all sections on the map with this text.

##### Examples
- Computer-terminal themed Escape Game with questions on the hex application itself.
- Deserted island themed Escape Game with questions about languages from around the world.
- Ancient map themed Escape Game with questions about history.

#### Falling words
Questions fall from the top of the screen, the learner must find the answer before they reach the bottom or collides with another question. When the pile of questions reaches the top, the game is over. Both typing and multiple choice modes. Alternative answers can be provided in columns 3 onwards. At the end of the game, learners can click on the fallen questions to see the answer at the bottom of the screen.

##### Activity settings
- **Color**. There are a number of color themes to choose from.
- **Shuffle**. When disabled, questions will drop in the order given.
- **Sounds**. Sound effects can be disabled.
- **Mode**. Typing or multiple-choice. In typing mode, learners can give as many guesses as they can before the word reaches the bottom or the top of the pile. In multiple-choice mode, they only have one guess, after which the question will immediately drop to the bottom.
- **In multiple choice mode, maintain the same options every time a question reappears**. When enabled, this will always show the same possible answers in the same order for each falling word. Wrong answers will be selected according to their similarity with the correct answer. The range of answers may not be the same from game-to-game. Always enabled if there four or fewer possible answers.
- **Difficulty**. Choose between Very easy, Easy, Medium, Hard, Ultra and Impossible. This varies the speed at which questions fall and the relief time between each question.
- **Required similarity to accept answer (%)**. Typing mode only. Difference between submitted answer and all possible correct answers. If the words are sufficiently similar, the answer will be accepted, but with a difference message and sound.
- **Loop**. Forever, Missed words first, Missed words only, Off. In order for the player to be able to complete the game, select **Missed words only** or **Off**.
- **Guess button**. Customise the wording.
- **Correct answer message**. Customise the wording.
- **Acceptable answer message**. Customise the wording.
- **Incorrect answer message**. Customise the wording.
- **Start instruction**. Customise the wording.
- **Winning message**. Customise the wording.
- **Losing message**. Customise the wording.
- **Abandon game confirmation**. Customise the wording.
- **Reset button**. Customise the wording.
- **Show answers instruction**. Customise the wording.

##### Examples
- Animals.
- French departments.
- Dependent prepositions. (Try this one in multiple choice mode!)

#### Four in a row
An activity for a whole class in two teams or two students at a shared device (tablet or computer preferably). The two teams take it in turns to drop a counter in a column, which they earn by answering a question correctly. The first team to have four counters of their color in a row (vertically, horizontally or diagonally) wins. There is a **faith** mode (learners answer the question before revealing the answer to see if they had it correct) and a **typing** mode, where the correct answer must be entered. Alternative answers can be provided for use in typing mode only.

##### Activity settings
- **Color**. There are a number of color themes to choose from.
- **Sounds**. Sound effects can be disabled.
- **Mode**. Faith (learners answer question aloud and then click to see the answer and report whether they are correct) or typing (answers must be typed in).
- **Required similarity to accept answer (%)**. Typing mode only. Difference between submitted answer and all possible correct answers. If the words are sufficiently similar, the answer will be accepted, but with a difference message and sound.
- **Rows**. The number of rows high for the board. Minimum 4, default 9.
- **Columns**. The number of columns wide for the board. Minimum 4, default 9.
- **Column labels**. Label that appears on the bottom of the board to easily identify the column. 
- **Show question preview**. By default, the questions are visible in the space where they need to be answered to earn the counter. 
- **Show team builder**. Show a screen at the beginning to write the names of the team mates. These will be shown at the bottom of the screen during their corresponding turns. This is mostly intended for SCORM packages (for which it is always enabled).
- **New game button**. Customise the wording.
- **Start game button**. Customise the wording.
- **OK button**. Customise the wording.
- **Show answer button**. Customise the wording.
- **Correct button**. Customise the wording.
- **Wrong button**. Customise the wording.

##### Examples
- Common Kanji (meanings in English).
- German adjective endings.

#### List order
Put a list in order. To create a more flexible order, you can provide a range as a percentage in the second column, or put a single number to indicate by how many positions the item can move up or down. To specify a flexible range in just one direction, start with - (for lower) or + (for higher). For example, `0-20%` in the second column will accept any answer in the top 20% portion of the list. A fuzz of `2` would mark as correct an item in any position up to 2 above or below its set position in the list, whereas `+2` will mark correct only if it's up to 2 above its current position. 

##### Activity settings
- **Color**. There are a number of color themes to choose from.
- **List color**. The list can show a gradient of colors (from several options) which is updated automatically, or just a single color from the main theme.
- **Invert list colors**. Swaps the top and bottom of the gradient.
- **Font size**. You can specify a smaller default font as a percentage. The activity already attempts to make the font as large as possible, so you cannot set a higher font size here.
- **Accept answers within a range of their position (fuzz).** Enable or disable fuzz.
- **Default fuzz (+/-)**. Apply fuzz to all items.
- **Minimum attempts**. Set to 0 to ignore. Otherwise, user must complete this many attempts before the ‘show answer’ button will appear. If 0, the ‘show answer’ button will never appear.
- **Maximum attempts**. Set to 0 to ignore. Further answers will be blocked after this number of attempts.
- **Attempts text**. Customise the label for the number of attempts.

##### Examples
- Colors.
- Instructions to make tea.
- Greetings (formal to informal)

#### Match
Match a prompt to an answer by dragging and dropping. It is possible to have a prompt with no answer or an answer with no prompt (i.e. a trap) by leaving one column blank. Twelve prompts or fewer will be shown in a list, whereas longer lists will be displayed in-line for more compact viewing. You can force a list by changing to side-by-side mode. The prompt can also be an image.

##### Activity settings
- **Color**. There are a number of color themes to choose from.
- **Font**. Change font family.
- **Font size (%)**. Increase or decrease the font size compared to the default.
- **Default view mode**. Top And Bottom or Side-By-Side. In the default mode, the bank of answers is shown at the top of the screen. In Side-By-Side mode the words are shown on the side and remain there even as the user scrolls down.
- **Allow user to switch view mode**. When enabled, the learner can choose between Top And Bottom or Side-By-Side.
- **Allow user to sort drawable cards alphabetically**. The cards in the bank are shown shuffled by default. However, by default the learner can re-order them alphabetically. Note that, if the activity detects that this would place the answers in the same order as their corresponding prompt, this option will be hidden. 
- **Allow user to shuffle cards again**. By default, learners can reshuffle the answers in the answer bank.
- **Lock in place correct answers**. Learners will not be able to unmatch items that have been correctly paired together.
- - **Minimum attempts**. Set to 0 to ignore. Otherwise, user must complete this many attempts before the ‘show answer’ button will appear. If 0, the ‘show answer’ button will never appear.
- **Maximum attempts**. Set to 0 to ignore. Further answers will be blocked after this number of attempts.
- **Check button**. Customise the wording.
- - **Attempts text**. Customise the label for the number of attempts.
- **Completion % (scorm only)**. The percentage of correct answers for the activity to be recorded as completed in the LMS. Has no effect when using the activity in **run** mode or when exported as HTML.

##### Examples
- British demonyms.
- Emoji.
- Sea creatures.
- Describing graphs.

#### Treasure hunt
Each question is displayed individually. To progress to the next question, the learner must type in the answer. The number of words and characters to type in is shown (if an alternative answer is provided, this is given as a range). 

##### Activity settings
- **Color**. There are a number of color themes to choose from.
- **Case sensitive**. By default, it doesn't matter whether learners use upper or lower case. Enable this option to enforce checking of the case as well.
- **Required similarity to accept answer (%)**. Difference between submitted answer and all possible correct answers. If the words are sufficiently similar, the answer will be accepted, but with a different message.
- **Instruction**. Customise the wording. In this option, use the wildcards to represent numbers and to form plurals. **%w** stands for the number of words, **%c** stands for the number of characters. **%s[]** is used to signal a plural ending, by default %s[s]. The character(s) in brackets will be shown when the last number in the string is above one. For example, the default “Enter %w word%s[s] (%c character%s[s]).“ will be rendered something like “Enter 1 word (10 characters).” for a single word answer of 10 characters.
- **Guess button label**. Customise the wording.
- **Correct answer message**. Customise the wording.
- **Acceptable answer message**. Customise the wording.
- **Incorrect answer message**. Customise the wording.
- **Winning message**. Customise the wording. This is shown when the last question is answered.

##### Examples
- Find three pieces of fruit.

#### Word order
The words provided in the **sentence** column will be shown in a random order and the learner will need to organise these to recreate the sentence. There are three optional columns: **prompt** shows some text before the sentence, **clue** appears after (and can be hidden until a condition is met by configuring this in the activity settings), and **traps** adds extra words which should be left out of the sentence.

**Activity settings**
**Color**. There are a number of color themes available.
**Clues shown**. When to reveal any clues.
**Punctuation behavior**. Whether to remove punctuation and restore it when the answer is revealed, keep it attached to the words, or separate it as another element to put in order.
**Hide sentence initial upper case**. Changes the first letter of a sentence to lower case.
**Preserve case**. 


#### Custom activities

See the section on making activities.

## Custom activity templates

### Prerequisites for creating a hex activity
You should know how to use HTML, CSS and Javascript (all the elements of a simple interactive website). However, even with only a basic knowledge of these, you can create a simple activity. There are plenty of resources online support forums and even AI assistants to help learn how to make a webpage. It's a really handy skill to have so I recommend having a go. All of the existing **hex** activities have been made by a complete non-professional (I'm a foreign language teacher), so really anyone can do it.

### Structure of a hex activity file
A hex activity file begins with `<!--*HEX SETTINGS START*`, then a JSON representation of its settings, which is followed by `*HEX SETTINGS END*-->`. The wording of these two pseudo-tags is important as **hex** looks specifically for these to find the configuration for the activity.

Here follows an example:
```
<!--*HEX SETTINGS START*
  {
    "cols_min":2,
    "cols_max":2,
    "rows_min":4,
    "cols":["Prompt","Answer"],
    "scorm_support":false,
    "description": "Describe your activity.",
    "settings":[
    {"name":"color","label":"Color","type":"select","options":["Default","Swedish furniture company","Black and white","Magnet","Rexby","Blorange"],"category":"look and feel"},
    {"name":"soundsEnabled","label":"Sounds","type":"checkbox","default":true,"category":"look and feel"},
    {"name":"fontSize","label":"Font size (%)","type":"number","default":100,"max":500,"category":"look and feel"},
    {"name":"text_newGame", "label":"New game button","type":"text","default":"New game","category":"language"},
    {"name":"text_startGame", "label":"Start game button", "type":"text","default":"Start game","category":"language"},
    {"name":"text_showAnswer", "label":"Show answer button","type":"text","default":"Show answer","category":"language"},
    {"name":"text_correct", "label":"Correct button","type":"text","default":"Correct","category":"language"},
    {"name":"text_wrong", "label":"Wrong button","type":"text","default":"Wrong","category":"language"}    
    ],
    "sample_data": [
            ["Albania","Tirana"],
            ["Andorra","Andorra la Vella"],
            ["Austria","Vienna"],
            ["Belarus","Minsk"],
            ["Belgium","Brussels"],
            ["Bosnia and Herzegovina","Sarajevo"],
            ["Bulgaria","Sofia"],
            ["Croatia","Zagreb"],
            ["Czechia","Prague"],
            ["Denmark","Copenhagen"],
            ["Estonia","Tallinn"],
            ["Finland","Helsinki"],
            ["France","Paris"],
            ["Germany","Berlin"],
            ["Greece","Athens"],
            ["Hungary","Budapest"],
            ["Iceland","Reykjavik"],
            ["Ireland","Dublin"],
            ["Italy","Rome"],
            ["Latvia","Riga"],
            ["Liechtenstein","Vaduz"],
            ["Lithuania","Vilnius"],
            ["Luxembourg","Luxembourg"],
            ["Malta","Valletta"],
            ["Moldova","Chisinau"],
            ["Monaco","Monaco"],
            ["Montenegro","Podgorica"],
            ["Netherlands","Amsterdam"],
            ["North Macedonia","Skopje"],
            ["Norway","Oslo"],
            ["Poland","Warsaw"],
            ["Portugal","Lisbon"],
            ["Romania","Bucharest"],
            ["Russia","Moscow"],
            ["San Marino","San Marino"],
            ["Serbia","Belgrade"],
            ["Slovakia","Bratislava"],
            ["Slovenia","Ljubljana"],
            ["Spain","Madrid"],
            ["Sweden","Stockholm"],
            ["Switzerland","Bern"],
            ["Ukraine","Kiev"],
            ["United Kingdom","London"]
           ]
        ]
  }
*HEX SETTINGS END*-->
```

Here are the possibility parameters. Apart from the column names, they are all optional.
|Parameter|Explanation|Notes|
|---|---|---|
|cols_min|The minimum number of columns.||
|cols_max|The maximum number of columns.|Recommended, unless the last column name can be repeated.|
|rows_min|The minimum number of rows.|Recommended.|
|rows_max|The maximum number of rows.||
|cols|The names for the columns, expressed as a JSON array. Optional columns will be determined by cols_min and cols_max. If there is no cols_max, it is recommended to add `"===="` as the last column name. This will repeat the previous column name for every column thereafter.||
|scorm_support|Signal to **hex** whether the activity has been built to interface with an LMS|Default: false|
|empty_cells_allowed|When set to true, empty cells within the range of the minimum rows and columns will not prevent the user running or exporting the activity.|Default: false|
|settings|The activity settings as a JSON object. See [activity settings](#activity-settings)||
|sample_data|Data to fill in for the example, expressed a JSON array.|Overrides sample_datas if present.|
|samaple_datas|Data for multiple examples, expressed as a JSON array of arrays.||

All javascript, HTML and CS must be contained within the same file. The file should not use any external scripts, fonts or images. For the latter two, these can be embedded using base64.

A function called `pageLoad`, taking no arguments, should be used for any javascript code that runs when the DOM is loaded, but this should not be called in the page itself. When **hex** runs or exports this activity, it will add its own call to this function. If there is no code to be loaded, this function should be included anyway. **hex** will add three global arrays: `gameData`,  `gameSettings` and `gameFiles`. `gameData` is a 2D array of the data from the table, where the first level represents rows and the second represents columns. `gameSettings` is an object containing the activity settings as set by the user. Its properties are named according the activity setting names set in the activity file. `gameFiles` is an object of objects containing the data and some meta-data of any files imported (currently only for the *climb* activity). Below is an example of what the `pageLoad` function might look like.

```
function pageLoad(){
    console.log(gameData)
    console.log(gameSettings)
    doSomethingWith(gameData)
    if(gameSettings.soundsEnabled){
        checkSoundsAndStart()
    else {
        startGame()
    }
}
```

Finally, the activity file much include the following script. For simplicity, it's easiest to include this at the top or at the bottom of the page.

`<script src="activityController.js"></script>`

When running an activity, this passes the `gameData`, `gameSettings` and `gameFiles` to the activity. When exporting, this is replaced with that same data.

### <a name="activity-settings">Activity settings</a>

No activity settings should be named **scorm**, as this is reserved for SCORM packages.

**Coming soon.**

### Adding SCORM support
**Coming soon.**

### Good practice
**Coming soon.**

### Using your own activities in hex
**Coming soon.**