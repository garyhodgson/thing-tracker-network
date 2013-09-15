/**
 * ThingMaker - make thing torrents
 * @author Derrick Oswald
 */

/*
 * ToDo:
 * from http://www.bittorrent.org/beps/bep_0005.html we replace the announce key with nodes key containing closest nodes somehow obtained from the BitTorrent client routing table:
 * Torrent File Extensions
A trackerless torrent dictionary does not have an "announce" key. Instead, a trackerless torrent has a "nodes" key. This key should be set to the K closest nodes in the torrent generating client's routing table. Alternatively, the key could be set to a known good node such as one operated by the person generating the torrent. Please do not automatically add "router.bittorrent.com" to torrent files or automatically add this node to clients routing tables.

nodes = [["<host>", <port>], ["<host>", <port>], ...]
nodes = [["127.0.0.1", 6881], ["your.router.node", 4804]]
 */
function ReadTorrent (torrent_file)
{
    // this would have been straight forward except
    // we need to use the binary version of the "pieces" element so that it
    // doesn't get converted to UTF-8 as required by the bencoding specification
    var binary_torrent = decode (torrent_file, true);
    var string_torrent = decode (torrent_file, false);
    string_torrent["info"]["pieces"] = binary_torrent["info"]["pieces"];
    // add a utility function
    string_torrent.toString = function () { return (JSON.stringify (this, null, 4)); };

    return (string_torrent);
}

function ReadTorrentAsync (file, callback)
{
    var reader = new FileReader ();

    // if we use onloadend, we need to check the readyState.
    reader.onloadend = function (evt)
    {
        if (evt.target.readyState == FileReader.DONE) // DONE == 2
        {
            var torrent_file = evt.target.result;
            var torrent = ReadTorrent (torrent_file);

            callback (torrent_file.name, torrent);
        }
    };
    reader.readAsArrayBuffer (file);
}

function str2ab (str)
{
    var len = str.length;
    var ret = new ArrayBuffer (str.length);
    var view = new Uint8Array (ret);
    for (var i = 0; i < len; i++)
        view[i] = (0xff & str.charCodeAt (i));

    return (ret);
}

function ReadStringAsync (str, callback)
{
    var arraybuffer = str2ab (str);
    var blob = new Blob([arraybuffer], {type: "application/octet-binary"});
    ReadTorrentAsync (blob, callback);
}

function ReadFileAsync (file, piece_length, callback)
{
    var reader = new FileReader ();

    // if we use onloadend, we need to check the readyState.
    reader.onloadend = function (evt)
    {
        if (evt.target.readyState == FileReader.DONE) // DONE == 2
        {
            var length;
            var text;

            length = evt.target.result.byteLength;
            text = "";
            for (var i = 0; i < length; i += piece_length)
                text += sha1 (evt.target.result.slice (i, i + piece_length)) + "\n";
            callback (text);
        }
    };
    reader.readAsArrayBuffer (file);
}

function makeLoadEndFunction (blobs, index, afterall)
{
    return function (evt)
    {
        var done;
        if (evt.target.readyState == FileReader.DONE) // DONE == 2
             blobs[index] = evt.target.result;
        done = true;
        for (var i = 0; i < blobs.length; i++)
            if (!blobs[i])
            {
                done = false;
                break;
            }
        if (done)
            afterall ();
    };
}

function ReadFilesAsync (files, piece_length, callback)
{
    var blobs = []; // collection of the file contents
    blobs.length = files.length;
    var afterall = function ()
    {
        //alert ("in afterall() with " + blobs.length + " files read in");
        var length;
        var text;
        text = "";
        length = 0;
        for (var i = 0; i < blobs.length; i++)
        {
            text += "file " + i + ": " + files[i].name + " " + files[i].type + " " + files[i].size + " loaded " + blobs[i].byteLength + " @ " + length + "\n";
            length += blobs[i].byteLength;
        }
        text += "length total " + length + "\n";
        // now we have our blobs, build it into one big blob
        var blob = new ArrayBuffer (length);
        var view = new Uint8Array (blob, 0, length);
        length = 0;
        for (var i = 0; i < blobs.length; i++)
        {
            view.set (new Uint8Array (blobs[i], 0, blobs[i].byteLength), length);
            length += blobs[i].byteLength;
        }
        // compute the hashes
        for (var j = 0; j < length; j += piece_length)
            text += sha1 (blob.slice (j, j + piece_length)) + "\n";
        callback (text);
    };

    for (var i = 0; i < files.length; i++)
    {
        //alert ("file " + i + ": " + files[i].name + " " + files[i].type + " " + files[i].size + "\n");

        var reader = new FileReader ();
//        onabort
//        Called when the read operation is aborted.
//        onerror
//        Called when an error occurs.
//        onload
//        Called when the read operation is successfully completed.
//        onloadend
//        Called when the read is completed, whether successful or not. This is called after either onload or onerror.
//        onloadstart
//        Called when reading the data is about to begin.
//        onprogress
//        Called periodically while the data is being read.

        // if we use onloadend, we need to check the readyState.
        reader.onloadend = makeLoadEndFunction (blobs, i, afterall);
        reader.readAsArrayBuffer (files[i]);
    }
}

