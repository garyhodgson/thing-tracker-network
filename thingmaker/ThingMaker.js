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

    // If we use onloadend, we need to check the readyState.
    reader.onloadend = function (evt)
    {
        if (evt.target.readyState == FileReader.DONE) // DONE == 2
        {
            var torrent_file = evt.target.result;
            var torrent = ReadTorrent (torrent_file);

            callback (torrent);

            var output = encode (torrent);
            document.getElementById ('bencode_content').innerHTML = "<a href='data:application/octet-stream;base64,"
                    + btoa (output) + "' download='output.torrent'>Torrent File</a>";

            // generate the 160 bit (40 hex characters) info primary key
            var info = torrent["info"];
            var primary_key = sha1 (encode (info));

            // spew it out as a magnet link URI
            var thing_file = file.name; // default name is the file name
            var title = torrent["info"]["thing"]["title"];
            if (null == title)
            {
                var n = thing_file.lastIndexOf (".");
                if (-1 == n)
                    title = thing_file;
                else
                    title = thing_file.substring (0, n);
            }
            title = title.replace (/\&/g, "and");
            title = title.replace (/ /g, "%20");
            document.getElementById ('magnet').innerHTML = "<a href=\"" + "magnet:?xt=urn:btih:" + primary_key
                    + "&dn=" + title + "\"  title=\"Download this torrent using magnet\">"
                    + "<img id=\"magnet_icon\" src=\"images/magnet.png\">Magnet" + "</a>";
        }
    };
    reader.readAsArrayBuffer (file);
}
