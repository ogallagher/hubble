<p>
    <a href="http://hubblegames.site/">
        <img src="https://github.com/ogallagher/hubble/blob/master/email_resources/network1.png">
    </a>
</p>

# Hubble
A webgame host written 99% in JS, using the p5 libraries for structure and visuals. It's set up to be mobile-device friendly and an easy platform for game developers to self-publish and for players to play!

# To Do
- [x] category icon
- [x] help icon
- [x] author icon
- [x] description icon
- [x] tag icon
- [x] use window.prompt() for search
- [x] loading display
- [x] send search request to server w/ data object
- [x] read search requests in the server
- [x] execute search requests server-side; oscillation from lexicographical origin
- [x] load search results into bubble tree
- [x] add Box option for Bubble.link
- [x] shift bubbles with dialogue to the corner in mobile browsers
- [x] create search.name and search.tags once the server returns matching games
- [x] add some more example/fake games into the games.json file server-side
- [x] don't display bubble.link if it contains a / character
- [x] remove games.categories
- [x] add games.tags to bubble tree
- [x] name icon
- [x] enable games.image display for both featured games and searched games
- [x] initiate a new search by tag when a game.tags.bubble is selected, or when a categories.bubble is selected
- [x] rewrite search algorithm to factor in the games' ratings
- [x] enable client to rate games (only after creating an account with an email address and password)
    - [x] client: edit /login to store incoming account.reviews
    - [x] client: add # (1-5) bubbles that branch off of games.rating
        - [x] in response to searched (name,tag) game additions
        - [x] in response to /featured game additions
        - [x] #.fill is determined by numStars OR account.reviews
            - [x] numStars = bubble.label.name if (bubble.link == “/rate” && this.focused)
            - [x] if (numStars >= #.label.name || #.focused), fill(255) 
        - [x] if address == "", prompt for the user to register or log in on select()
        - [x] if address.length < 0, add branches to game.rating, which send /rate get to server on select()
        - [x] handle server’s response to /rate: update game.rating and account.reviews
            - [x] fix alterations of game.rating and account.reviews. The former appends as a string, and the latter doesn’t seem to change at all -> I think the query’s JSON wasn’t parsed correctly server-side
    - [x] server: add game.reviews to store the number of people that have rated the game
    - [x] server: add account.reviews to store the games and that users have rated, and what ratings they gave (account.reviews.game,...rating)
        - [x] edit /register handler function
    - [x] server: handle /rate html get
        - [x] to update, game.rating = (game.rating * game.reviews / game.reviews+1) + (NEW_VALUE / game.reviews+1)
        - [x] if account.reviews contains this game already, game.rating += RATING_CHANGE / game.reviews
        - [x] update account.reviews
        - [x] send response to client
- [x] enable dialogue box page flipping
    - [x] page splitting character will denote multiple pages
    - [x] bubble.book stores many-paged dialogue boxes
    - [x] update bubble.book.bookMark when bubble.select() is called and bubble.selected is true
    - [x] change bubble.displayText()
- [x] add more games that are mobile-compatible and more varied in type
- [x] server.addGame() function:
    - [x] add to games.byName lexicographically
    - [x] add to games.byRating according to current game.rating
- [x] client: mobile: in displayText(), enable box movement to all 4 corners of the view
- [x] enable registration and log-in
    - [x] client: add register bubble
    - [x] client: add login bubble
    - [x] client: add address variable
    - [x] client: register() function: email, password; send email;
    - [x] client: login() function: get email, password; send to server for verification; upon positive response, continue; upon negative response, alert failure
    - [x] server: use nodemailer.js to send the email to a specified destination account (origin server = gmail.com)
    - [x] server: handle /register and /login html requests
    - [x] server: add accounts.json to store emails and passwords
    - [x] server: use filesystems module to rewrite accounts.json in /register handling
- [x] if bubble.link is a dialogue box, and if bubble.link.length < SEAL_MAX, display bubble.link around the bottom like label.name, but without grow/shrink and disappear
- [x] fix authors bubble to display each author on a separate branch
- [x] do not display bubble.link in the corner if already displayed around the bubble
- [x] fix display of bubble.label.name
    - [x] create client-wide and mobile-wide variable: hovering
    - [x] hovering = true, if (distance(bubble,cursor) < bubble.size*0.5 && touches.length - [ ] 0)
    - [x] background darkens
    - [x] increase circumference for bubble.label.name display
    - [x] create bubble.touched variable (to see which bubble is activating hovering)
    - [x] other bubbles darken
- [x] server: fix search functions to not return repeat games
- [x] category icons
    - [x] version
    - [x] multiplayer
    - [x] racing
    - [x] strategy
    - [x] action
    - [x] puzzle
    - [x] adventure
- [x] if bubble.label.name is too long, show until NAME_MAX
- [x] mobile: only call home.select() if tapped (not dragged and lifted)
- [x] mobile: if background tapped, be able to go back to home without closing all branches
- [x] register icon
- [x] login icon
- [x] server: create searchGames() functions to lessen redundancy in usage between /search response and /rate response
- [x] encrypt passwords
    - [x] client: don’t permit spaces in passwords
    - [x] server: encrypt passwords before storing in accounts.json for registration
    - [x] server: encrypt incoming password to check if login is valid
- [x] server: prevent redundant search results that appear for overlapping search terms
- [x] server: update games.byTag’s order in the /rate request handler function by deleting the edited game from its current position and then putting it back according to newRating
- [x] client: #bubble.fill if account.reviews contains it’s game and account.reviews[r].rating >= this.label.name
- [x] client: don't mute stars in mobile
- [x] client: don't deselect and return home after rating or trying to rate
- [x] client: add account.information...
    - [x] reviews
    - [x] username
    - [x] register date (bday)
    - [x] age
    - [x] curator status
    - [x] the above categories are stored in an info (i) bubble’s dialogue box
- [x] sometimes passwords won’t save correctly and aren’t recognized by the server upon login…
- [x] client: move cursor to center after release in select() function
- [x] client: move cursor to corner if bubble.link is a text box—— too difficult to implement; not worth the trouble
- [x] client: add loading variable to Bubble class, so other bubbles don’t pulse when fetching information
    - [x] fix loading animation for origin bubbles, so they stop pulsing when their branches are no longer loading
- [x] create way to add games
    - [x] client: add curate bubble branch off of the account bubble
        - [x] on select, if curator, open a prompt for:
            - [x] url,
            - [x] name (starts w/ capital letter, only letters, numbers, and spaces),
            - [x] description (inserts page breaks for lengthier ones),
                - [x] fix insertion to find first space before the character that hit the page maximum
            - [x] authors,
            - [x] rating, and
            - [x] tags
            - [x] then send /curate request to server with the specified curator and game data to be stored in submissions.json, until the hubble admin handles the new addition
        - [x] on select, it not curator, send /curate request to server
    - [x] server: create submissions.json
    - [x] server: add account.[curator,bday] and change registration and login handlers
    - [x] server: handle registration
    - [x] server: handle /curate request
        - [x] if account.curator, add submission to submissions.json
        - [x] else, change account.curator to null and send notary email to hubbleojpgapps@gmail.com
        - [x] new game_icons directory to be stored where the .json files are stored (the directory will be edited from the admin interface)
    - [x] create way to add game icons (file download prompt for admin)
- [x] handle null possibility as account.curator
- [x] make sure /featured and /search client responses handle my read errors sent from the server (when game icon files are not found)
- [x] disable selection of hidden bubbles
- [x] select account(or admin) bubble after login
- [x] client: edit.accounts: set accounts bubble.loading to -1 when admin edit == null
- [x] server: admin check against address instead of position in accounts array
- [x] move .json files and game_icons directory so they aren’t overwritten
- [x] fix file path environment variable 
    x create /hubble_data directory on google drive with hubble account (hubble_google_drive)
    x add googleapis js module to the server
    x use googleapis to retrieve .json files from hubble_google_drive/hubble_data
    x add an sql database to hubble
        x create and configure the database
        x link database to hubble (grab pertinent credentials)
            x add mysql module to server
            x username: hubblegames
            x password: hubbleconnect
            x db name: hubbledb
        x create dbinit.sql file
            x add tables to database
            x accounts
            x games
            x submissions
            x fill tables
    x replace require() and fs.(read()/write()) functions with mysql code
        x select
        x insert
        x delete
    - [x] add persistent storage volume hubblestorage in the /data directory
        - [x] move the .json and game_icons files there
        - [x] change path in server.js
- [x] $npm ls showed many extraneous modules included in hubble that I can probably remove
- [x] an old search result repetition bug seems to have returned
- [x] bought the domain name hubblegames.site from iwantmyname.com for $10
- [x] update url for shuffle
    - [x] in server add /shuffle get handler
    - [x] in hubble’s games.json
    - [x] add hubblegames.site/shuffle domain to iwantmyname.com’s index
- [x] update (server.js).(/search) handler so nextGameBy_() functions are not defined in local scopes (should make it faster)
- [x] logout button
    - [x] logout icon: arrow to rectangle, exit sign,…
    - [x] introduce logout bubble by replacing the register and login bubbles
    - [x] add /logout to Bubble.select()
- [x] use invisible html form with image input for admin’s game icon file upload
- [x] server.js: fix use of fileGames,fileAccounts,fileSubmissions for the new (proceed,fail) procedural arguments
- [.] write the help menu
    - [x] read: tap on the bubble again to flip to the next page
    - [x] return: tap on the background to return to the previous bubble
    - [x] select: tap on a bubble to select it; drag the finger around to screen to see labels
    - [x] search: tap the search bubble to insert search terms; tapping on tags and categories does so automatically
    - [ ] rate: first, register an account and log in. Then, go to any game and select the rating bubble. 5 stars will appear, and you can choose however many you see fit.
    - [ ] register: go to accounts, register and create email+password; then go to accounts,login…
    - [x] play: select a game bubble to go to that game’s website
    - [ ] curate: to request curator status, go to accounts, curate (you need to be logged in) and select it. If you’re already a curator, you are guided through your submission for a new game.
- [ ] account.recover_password bubble
- [x] add random bubble
    - [x] client: random icon
    - [x] client: create /random query from bubble
    - [x] server: /random html get handler returns a group of random games from games.byName
    - [x] client: add resultant game branches to random bubble
    - [x] client: update display(), fix references to searchedGames
- [x] create admin interface for hubbleojpgapps@gmail.com (replace curate bubble with an edit.(accounts,games) bubble)
    x accounts
        - [x] accounts.replace
            - [x] open a prompt filled in with the current data from accounts.json
            - [x] on close of prompt, accounts.json file is replaced with the edited version
        x accounts.curators
            x branches are usernames and YES/NO. They switch boolean values on select
            x on second select, edited accounts are send to the server
    - [x] games.append (+)
        - [x] add an add branch for every submission from submissions.json
        - [x] append.link = /games_append_new
        - [x] one of games.append.submission.branches.select() should open a file input for the game's icon
        - [x] send game data with submission index to the server
        - [x] server: add game
        - [x] server: remove old submission
        - [x] server: send email to appropriate curator
        - [x] server: add game icon as well
        - [x] support edits to submission.branches
            - [x] /submissions_replace
            - [x] /submissions_remove
            - [x] games.replace
            - [x] same as accounts.replace
- [x] fix age.month calculation
- [x] change games administration
    - [x] add game.remove to every game in search results and featured games (/games_remove)
    - [x] add game.edit to every game in search and featured, too (/games_replace)
    - [x] client: /games_remove query
    - [x] client: /games_replace query
    - [x] server: /games_remove handler
    - [x] server: /games_replace handler
- [x] change accounts administration
    - [x] accounts sends /accounts to server to search by accounts by email
    - [x] accounts.account.edit (/accounts_replace)
        - [x] fix server/accounts_replace (it overwrites accounts with only the account edited)
        - [x] fix client/accounts_replace also (the data was not converted right again, a JSON/JS issue)
    - [x] accounts.account.remove (/accounts_remove)
    - [x] server: /accounts handler
    - [x] server: /accounts_replace handler
        - [x] modify server:searchAccounts() to have a completeReturn boolean argument
    - [x] server: /accounts_remove handler
- [x] server: fix addGame() function so it includes game.(reviews,featured,etc)
- [x] edit bubbles without icons so tag.label.text displays without clicking on it
- [x] remove icon: (-)
- [x] add remove icon to client: images.push(loadImage())
- [x] server: in registration email, add link to delete account (http://host.com/accounts_remove?oldAccount=username@domain.com)
- [x] add html versions of the emails
    - [x] registration
    - [x] curator approval
    - [x] submission approval
    - [x] curator application
- [x] server: fix /curate handler when client applies to curate and is already approved
- [x] add "more" bubble capability and backwards parent references
    - [x] create MAX_BRANCHES
    - [x] edit bubble constructor: account for more bubbles and which have extra==true
    - [x] edit bubble.addBranch() to account for MAX_BRANCHES
    - [x] edit bubble.display()
    - [x] add bubble.parent reference and gameBubble.rating
        - [x] use both for /rate bubbles
        - [x] use former for /more bubbles
        - [x] add parent argument for bubble constructor
        - [x] modify search, random, and featured results to set game.ratings.star.parent
    - [x] edit bubbles that receive server results
        - [x] /search
        - [x] /featured
        - [x] /submissions
        - [x] /accounts
        - [x] /random
    - [x] the icon is: (•••)
    - [x] when pressed, parent.bubbles changes to display the rest of the results (disable selection with bubble.link = "/more")
    - [x] add bubble.rotate(): all branches shift clockwise 1 step, all branches.branches rotate correctly and update their anchors
- [x] server: change RESULT_MAX to be ~30
- [ ] what to do with author bubbles
    - [ ] add authors.json
        - [ ] links
        - [ ] name
        - [ ] edit /curate handler to modify authors
        - [ ] edit /games_append handler to modify authors
    - [ ] if no links are specified, the default link is a google search of the game and the author: https://google.com/search?q=author+game&rls=en&ie=UTF-8&oe=UTF-8
    - [ ] edit curation and administration according to addition of author.links
        - [ ] curator suggests author name and links
        - [ ] admin: reviews suggestions for new and existing authors to attribute to the game. Existing authors are a result of server’s /author search handler
        - [ ] admin: can edit authors to modify author.links
    - [ ] server: /author search handler (searches authors, not games by a given author)
    - [ ] add searchByAuthor for games
        - [ ] server: modify games.byTag to include authors list
        - [ ] server: within searchGamesByTag, also check authors and add results to another search results array to have: nameResults, tagResults, and now authorResults
        - [ ] client: modify games.author.select() to open a search of games by that author
        - [ ] client: add results by author to search bubble
    - [ ] server: keep games array synchronized with authors array
        - [ ] game.authors pulls links from authors on demand
        - [ ] authors.remove() => when server tries to pull that author’s links for a game and returns null, that author is deleted from game.authors
- [ ] server: improve password encryption
    - [ ] picks a seed
    - [ ] scrambles using the seed, bounded with the remainder function. The resulting characters have multiple possible original characters.
    - [ ] appends the seed to the end of the code and stores in account.password
- [x] only this.bubbles.updateAnchor() if this.extension changes or window is resized
- [x] server: fix /random handler
- [ ] improve search functions to use the latter letters when hashing
- [ ] consolidate tag, name, and author search types
    - [ ] client: attach all incoming search results to the search bubble
    - [ ] ?client: for all tag and author auto-searches, fix references to search bubble
    - [ ] server: for each term, check name, then tag, then author, using a single results array
