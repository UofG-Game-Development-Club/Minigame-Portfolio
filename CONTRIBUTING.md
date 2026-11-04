# Add your game

You do not need Git, terminal commands, or knowledge on version control. Only a GitHub account and a web browser is necessary.

## 1. Make your game folder

1. On this page, click the green Code button, then download the ZIP, and unzip the folder.
2. Find the folder `games/_template`. Copy it to where you know you can find it.
3. Rename the copy to your game's name, using lowercase letters, numbers, and hyphens only (ex. `snake`, `2048`, `this-game-has-multiple-words`).
4. Open the files in a text editor and build your game.
5. Open `game.json` and fill in your game's details:

   ```json
    {
    "title": "Your Game",
    "author": "Your Name",
    "description": "This is a concise description for your game.",
    "tags": ["tutorial", "educational"],
    "optionalthumbnail": "thumbnail.png"
    }
   ```

   Obviously, `optionalthumbnail` is optional. Add a picture (PNG, JPG, or SVG) to your folder and put its filename here. If you skip it, your game gets a colored tile with its first letter for the thumbnail.

6. Test it: run your folder's `index.html`.

## 2. Submit it

1. Open this repository on GitHub and click into the games folder.
2. Click Add file -> Upload files.
3. Drag your game folder (only yours!!) into the page.
4. If GitHub says you need to fork the repository, click the button to continue. This should only impact your folder/files, not anyone else's.
5. Scroll down and click "Propose changes", then "Create pull request".


## 3. Wait for the submission to be validated

Your submission will automatically be validated The first time you submit, an organizational owner (e.k.a. any exec in the club) may need to approve it first before the automatic validation.

- Green check: You're done! A club executive will add your game.
- Red X: click "details" and read the message. It should tell you what to fix. Fix the file on your computer and upload it again to the same pull request, or ask someone for help.

## Rules so every game plays nicely together

- Keep everything inside your own folder. Never touch other people's folders or the files outside `games/`.
- Use relative file names like `style.css` or `images/ship.png`. Never use `../` or full web addresses for your own files.
- Your game must have an `index.html`** right inside your folder.
- No `localStorage` or cookies. Games run in a sealed box where the browser blocks them. Keep scores in variables instead.
- No outside services: don't load scripts or images from other websites, so your game works for everyone.
- Wrap your JavaScript in `(() => { ... })();` like the template does. It's a good habit even though games can't affect each other.

## Updating your game later

Submit it the same way. The validation will say a game with the same name already exists (but that's fine). Ask an executive to approve the update.