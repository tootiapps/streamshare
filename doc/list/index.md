# Lists

To manage your streaming link lists.

**Step 1:** Access the "Settings" tab and then go to the "Lists" section.

**Step 2:** Click the "+" button to access the following features:

**2.1: Create a New List**
This option allows you to create a new blank list.

**2.2: Import a List from a File**
You can import lists that have been previously exported from Streamshare or create lists manually. These lists must follow a JSON structure.

Here's an example:

```json
{
    "name": "My first list",
    "sourceURL": null,
    "items": [{
        "filename": "Big.Buck.Bunny.mp4",
        "url": "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
        "type": null,
        "tmdbID": null,
        "tmdbEpisodeID": null,
        "episode": null,
        "season": null,
        "excludeFromCollection": null,
    }]
}
```

Note: The items in your list must at least include the `url` property.

**2.3: Import a List from a URL**
The principle is the same as importing from a local file. Your JSON file must be accessible via HTTP. Additionally, remote lists can be resynchronized whenever you wish from the dedicated list menu.

**Step 3:** Export a List
Click on a list and select "Export." The list will be saved in the "Downloads" folder on your device.