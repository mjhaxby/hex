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

#### Exporting the table
To save your table somewhere else: Tools → Export table as tabbed text / Export table as JSON.

### Activity settings
Open the activity settings drawer to adjust any available settings for the selected activity. As a minimum, each activity should have an "about" section which will explain how the activity works, and an "example" button, which will fill in the table with some sample data. This way, if you're not sure how an activity works, you can run it straight away with the example data and try it out yourself before putting in your own data.

Other settings may include, color options, sound controls, difficulty levels and options to custom certain labels in activities (which is useful if you don't want your activity to be in English). More details in the Activities section.

It is not (yet!) possible to change the defaults for activity settings. This will be reset every time you re-open the app or when you change activity.

### Run
Clicking on **Run** will open the selected activity in a new window, using the data from the table and the activity settings. You can reset any activity with the shortcut Ctrl+R or Cmd+R on a Mac. If you make any changes to the data in the table, you will need to close the activity window and press run again to see these changes in the activity. This means that you can run as many activities as you like with the same or with different sets of data.

You can also export the activity from the menu while running it.

See the section [Errors on run or export](#Errors-on-run-or-export) for any errors.

### Export
Clicking on **Export** will open a dialog to save an HTML page. This page will open in any modern browser and allow you to run this activity any time. You can also upload this page to a website or add to a Moodle page (see the section [Adding to Moodle](#Adding-to-Moodle).

The exported file contains everything the activity needs to run, including styles, scripts, fonts and images. This is not typical for an HTML page (normally the best practice is to store components separately. However, this makes it much simpler to manage activities and add them to other websites or LMS (Learning Management System). Very large **hex** activities may take a long time to load and the application has not been tested with datasets of more than about 200 rows. 

#### Exporting SCORM
You can also export SCORM packages for some activities. You will need to first show the advance export options (**View** → **Advanced export options**). You can then switch from HTML to SCORM. When exporting, you will be able to save a ZIP file (the format used for SCORM packages).

SCORM packages have a unique identifier to be distinguished by the LMS (Learning Management System, such as Moodle).       
If you want to be able to update your package earlier, you should keep a copy of the automatically generated identifier. This appears in the **id** box and is also shown when exporting. When producing a new version of the same SCORM package, you should paste the identifier in the **id** box. If you export with a new identifier, the LMS will consider this a new package and learner information associated with this package may be lost. You can also use whatever you want as an identifier (“banana” for example would work, though it is recommended to have something a bit more unique). However, you should not reuse the same identifier for two packages on the same course, as the LMS will not be able to distinguish them.

If you're worried about accidentally generated two identifiers that are the same: don’t. When you export without an identifier or click on the dice button **hex** makes a UUID. Wikipedia has this to say about UUIDs:
> Only after generating 1 billion UUIDs every second for the next 100 years, the probability of creating just one duplicate would be about 50%. Or, to put it another way, the probability of one duplicate would be about 50% if every person on earth owned 600 million UUIDs.

The SCORM packages generated by **hex** typically provide a score between 0 and 100 (essentially a percentage) and also try to save progress if a user exits an activity before finishing it. It also saves some interactions so you can get an idea of what a learner actually did in the activity and how long they spent doing it. This makes it much more appropriate for tracking learning. However, please bear in mind that SCORM packages are not appropriate for testing, especially without surveillance. Both **hex** activities and the SCORM API use Javascript, which can be manipulated relatively easily in any browser by opening the Javascript console.

At the moment, exporting as SCORM is only available for the **Match** and **Blockbusters** activities, the latter still being slightly experimental.

#### <a name="Adding-to-Moodle">Adding to Moodle</a>
In edit mode, simply drag and drop the exported file onto the Moodle page where you want the activity. For a SCORM package, you will need to select this from the pop up. Alternatively, click the **Add a new activity or resource** button, select either File or SCORM package and then upload the **hex** activity.

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

In someone *does* try to cheat (saying the word in their own language, telling the team leader the word, the team leader looking at the board…), there is a penalty button. This will add another word from the list.

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

#### Crossword
Create a crossword puzzle from the answers and clues. In most cases, not all will be provided, a better puzzles are usually generated by supplying a longer list of possible answers and clues. Every time the activity is loaded, a new puzzle will be generated. However, you can reuse the same puzzle again by clicking on the button in the top-right corner and copying the game code into the activity settings. This will force the activity to create the same puzzle every time. 

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

#### Drill
An activity for individual use to start learning vocabulary. In default mode, each piece of vocabulary passes through the following stages: listen and repeat (back-drilling), read and rewrite (back-drilling), read and rewrite, say the world aloud from memory, rewrite from memory. For each item at each stage, the learner can decide to move on to the next step (so long as they have fulfilled the criteria for completion) or review the item again, in which case they will go back up to two stages. Back-drilling happens automatically for phrases; the final word is presented first, following by the final two words and so on until the whole phrase has been built. For words, back-drilling will be used when the words are split up by the activity creator (by default using **/**). The activity uses the speech synthesis of the device it is run on, therefore the appropriate languages must be installed by the learner for this to work correctly. In the fourth column, you can override how the speech synthesis pronounced a word by writing it in whatever way obligates the speech synthesis to say it correctly. To provide a speech synthesis for individual parts, put this in [square brackets], with the same separators as in the Word/Phrase column.

##### Activity settings
- **Word separator**. Choose the character to separate longer words into shorter ones.
- **Language for speech synthesis**. The language to offer voices from when running the activity. For some languages, you can choose both the overall language or a dialect. Bear in mind that not all devices will have all languages available. The quality of voices may vary from device to device and depending on the version of the users' operating system.

##### Examples
- Debate language (French to English).
- Basic English words.


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
Match a prompt to an answer by dragging and dropping. It is possible to have a prompt with no answer or an answer with no prompt (i.e. a trap) by leaving one column blank. Twelve prompts or fewer will be shown in a list, whereas longer lists will be displayed in-line for more compact viewing. You can force a list by changing to side-by-side mode.

##### Activity settings
- **Color**. There are a number of color themes to choose from.
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