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

// files to include
var Files = null;
var Blobs = null; // collection of the file contents
var PieceLength =  16384;
var Hashes; // ArrayBuffer of hashes

function printpieces (pieces, tabspace)
{
    var view;
    var br;
    var ret;

    ret = "";

    view = new Uint8Array (pieces);
    br = 0;
    for (var i = 0; i < view.byteLength; i++)
    {
        if (0 == (br % 20))
            for (var j = 0; j < tabspace; j++)
                ret += " ";
        ret += ((view[i] >>> 4) & 0x0f).toString (16);
        ret += (view[i] & 0x0f).toString (16);
        if ((0 == (++br % 20)) && (i + 1 < view.byteLength))
            ret += "\n";
    }

    return (ret);
}

function printTorrent (torrent)
{
    var trigger = "\"pieces\": {}";
    var index;
    var tabspace;
    var raw_text;
    var ret;

    ret = JSON.stringify (torrent, null, 4);
    // kludgy way to add the hash values
    index = ret.indexOf (trigger);
    if (0 < index)
    {
        tabspace = 0;
        while (" " == ret.substr (index - tabspace - 1, 1))
            tabspace++;
        raw_text = printpieces (torrent["info"]["pieces"], tabspace + 4);
        s = "";
        for (var j = 0; j < tabspace; j++)
            s += " ";
        ret = ret.substr (0, index) + "\"pieces\": {\n" + raw_text + "\n" + s + "}" + ret.substr (index + trigger.length);
    }

    return (ret);
};

function ReadTorrent (torrent_file)
{
    // this would have been straight forward except
    // we need to use the binary version of the "pieces" element so that it
    // doesn't get converted to UTF-8 as required by the bencoding specification
    var binary_torrent = decode (torrent_file, true);
    var string_torrent = decode (torrent_file, false);
    string_torrent["info"]["pieces"] = binary_torrent["info"]["pieces"];
    // add a utility function
    string_torrent.toString = function () { return (printTorrent (this)); };

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

function cvt_hex (val)
{
    var str = "";
    var i;
    var v;

    for (i = 7; i >= 0; i--)
    {
        v = (val >>> (i * 4)) & 0x0f;
        str += v.toString (16);
    }
    return str;
}

function ReadFilesAsync (files, piece_length, callback)
{
    Files = files;
    Blobs = [];
    Blobs.length = files.length;
    PieceLength = piece_length;

    var afterall = function ()
    {
        var length;
        var text;
        text = "";
        length = 0;
        for (var i = 0; i < Blobs.length; i++)
        {
            text += "file " + i + ": " + files[i].name + " " + files[i].type + " " + files[i].size + " loaded " + Blobs[i].byteLength + " @ " + length + "\n";
            length += Blobs[i].byteLength;
        }
        text += "length total " + length + "\n";
        // now we have our blobs, build it into one big blob
        var blob = new ArrayBuffer (length);
        var view = new Uint8Array (blob, 0, length);
        length = 0;
        for (var i = 0; i < Blobs.length; i++)
        {
            view.set (new Uint8Array (Blobs[i], 0, Blobs[i].byteLength), length);
            length += Blobs[i].byteLength;
        }
        // compute the hashes
        Hashes = new ArrayBuffer (Math.ceil (length / piece_length) * 20);
        var hashview = new Uint8Array (Hashes);
        var index = 0;
        for (var j = 0; j < length; j += piece_length)
        {
            var hash = sha1 (blob.slice (j, j + piece_length), true);
            var temp = new Uint8Array (hash);
            for (var k = 0; k < 20; k++)
                hashview[index++] = temp[k];
            var raw_text = "";
            for (var k = 0; k < 5; k++)
            {
                var d = 0;
                for (var l = 0; l < 4; l++)
                    d = (d << 8) + (temp[k + l] & 0xff);
                raw_text += cvt_hex (d);
            }
            text += raw_text.toLowerCase () + "\n";
        }
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
        reader.onloadend = makeLoadEndFunction (Blobs, i, afterall);
        reader.readAsArrayBuffer (files[i]);
    }
}

function MakeTorrent ()
{
    var epoch;
    var infohash;
    var ret;

    // javascript date is number of ms since epoch
    epoch = Math.round ((new Date ()).getTime() / 1000.0);
    if (1 == Files.length)
        infohash = {
                "length": Files[0].size,
                "name": Files[0].name,
                "piece length": PieceLength,
                "pieces": Hashes
            };
    else
    {
        filedata = [];
        for (var i = 0; i < Files.length; i++)
            filedata[filedata.length] = {
                "length": Blobs[i].byteLength,
                "path" : [Files[i].name]
                };
        infohash = {
                "files": filedata,
                "name": "SampleDirectory", // where to get the directory name?
                "piece length": PieceLength,
                "pieces": Hashes
            };
    }
    ret =
    {
        //"comment": "Super simple thing.",
        "created by": "ThingMaker v0.1",
        "creation date": epoch,
        "encoding": "UTF-8",
        "info": infohash
    };

    return (ret);
}

