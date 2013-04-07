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