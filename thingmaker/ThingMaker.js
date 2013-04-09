/**
 * ThingMaker - make thing torrents
 * @author Derrick Oswald
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

function ReadFileAsync (file, callback)
{
    var reader = new FileReader ();

    // if we use onloadend, we need to check the readyState.
    reader.onloadend = function (evt)
    {
        if (evt.target.readyState == FileReader.DONE) // DONE == 2
        {
            var text = sha1 (evt.target.result);
            callback (text);
        }
    };
    reader.readAsArrayBuffer (file);
}


