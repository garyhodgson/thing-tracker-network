/**
 * bencoder - bencode for client side use
 * @author Derrick Oswald
 * 
 * Google search on "bencode" "javascript" yields:
 * https://github.com/themasch/node-bencode/blob/master/bencode.js
 * https://github.com/clarkf/node-bencoding/blob/master/lib/bencoding.js
 * https://github.com/deoxxa/bencode-stream/blob/master/lib/decoder.js
 * https://github.com/Sebmaster/node-libbencode/blob/master/lib/bencode.js
 * https://github.com/benjreinhart/bencode-js/blob/master/src/bencode.js
 * http://demon.tw/my-work/javascript-bencode.html
 * http://svn.mg2.org/projects/pco/browser/trunk/net/cjdns-mikey/admin/http/text/javascript/bencode.js?rev=8
 * https://code.google.com/p/jsxt/source/browse/trunk/js/Bencode.js?spec=svn491&r=491
 * 
 * All of the above either depend on the node.js Buffer class so they aren't applicable
 * to client side use (maybe lobrow could be used) or have done string
 * encoding wrong in various ways (I think).
 * None of them uses the HTML5 ArrayBuffer so they appear to be old.
 * Here then is an implementation using current HTML5 capabilities.
 */

/**
 * Decodes bencoded data.
 * 
 * @param {ArrayBuffer} buffer
 * @param {any} raw Non-null if strings should be returned as ArrayBuffer 
 * @return {Object|Array|ArrayBuffer|String|Number}
 */
function decode (buffer, raw)
{
    if (!(buffer instanceof ArrayBuffer))
        throw "not an ArrayBuffer";

    decode.position = 0;
    decode.raw = raw || null;
    decode.buffer = buffer;
    decode.size = buffer.byteLength;
    decode.data = new DataView (buffer);

    return (decode.next ());
}

decode.position = 0;
decode.raw = null;
decode.buffer = null;
decode.size = 0;
decode.data = null;
decode.encoding_table = [];
for (var i = 0; i < 256; i++)
    decode.encoding_table.push (encodeURIComponent (String.fromCharCode (i)));

decode.next = function ()
{
    var ret;

    switch (decode.data.getUint8 (decode.position))
    {
        case 0x64: // 'd'
            ret = decode.dictionary ();
            break;
        case 0x6C: // 'l'
            ret = decode.list ();
            break;
        case 0x69: // 'i'
            ret = decode.integer ();
            break;
        default:
            ret = decode.bytes ();
            break;
    }
    
    return (ret);
};

decode.dictionary = function ()
{
    var ret;

    ret = {};

    decode.position++; // past the 'd'
    while (decode.data.getUint8 (decode.position) !== 0x65) // 'e'
        ret[decode.next ()] = decode.next ();
    decode.position++; // past the 'e'

    return (ret);
};

decode.list = function ()
{
    var ret;

    ret = [];

    decode.position++; // past the 'l'
    while (decode.data.getUint8 (decode.position) !== 0x65) // 'e'
        ret.push (decode.next ());
    decode.position++; // past the 'e'

    return (ret);

};

decode.integer = function ()
{
    var i;
    var limit;
    var c;
    var ret;
    
    ret = 0;
    
    i = ++decode.position; // past the 'i'
    limit = decode.size;
    while (i < limit)
        if ((c = decode.data.getUint8 (i)) === 0x65) // 'e'
            break;
        else
        {
            c -= 0x30; // '0'
            if ((c < 0) || (c > 9))
                throw "invalid character '" + String.fromCharCode (c + 0x30) + "' found in number at offset " + i;
            ret = 10 * ret + c;
            i++;
        }
    if (++i > limit) // past the 'e'
        throw "'e' not found at end of number at offset " + decode.position;
    decode.position = i;

    return (ret);
};

decode.bytes = function ()
{
    var i;
    var limit;
    var c;
    var length;
    var ret;

    ret = null;

    length = 0;
    i = decode.position;
    limit = decode.size;
    while (i < limit)
        if ((c = decode.data.getUint8 (i)) === 0x3A) // ':'
            break;
        else
        {
            c -= 0x30; // '0'
            if ((c < 0) || (c > 9))
                throw "invalid character '" + String.fromCharCode (c + 0x30) + "' found in string size at offset " + i;
            length = 10 * length + c;
            i++;
        }
    if (++i > limit) // past the ':'
        throw "':' not found in string size at offset " + decode.position;
    decode.position = i + length;
    ret = decode.buffer.slice (i, decode.position);
    if (!decode.raw)
        ret = decode.stringize (ret);

    return (ret);
};

/**
 * stringize - convert an ArrayBuffer, theoretically of UTF-8 encoded bytes, into a String.
 * All strings in a .torrent file that contains text must be UTF-8 encoded.
 * @param {ArrayBuffer} buffer
 * @return {String}
**/
decode.stringize = function (buffer)
{
    var data;
    var fragments;
    var i;
    var limit;
    var str;
    var ret;
    
    ret = "";
    
    // we use the hack described here:
    // http://monsur.hossa.in/2012/07/20/utf-8-in-javascript.html
    // but the correct way is to use a reader to read the utf8 encoded bytes into a string
    // but the trouble with that is it is asynchronous:
    // nope :-( can't do this: var reader = new FileReaderSync ();
    // reference: http://ecma-international.org/ecma-262/5.1/
    data = new DataView (buffer);
    fragments = [];
    limit = buffer.byteLength;
    // ToDo: check if it's faster to concatenate directly to a string instead of making an array first
    for (i = 0; i < limit; i++)
        fragments.push (decode.encoding_table [data.getUint8 (i)]);
    str = fragments.join ('');
    ret = decodeURIComponent (str);
    
    return (ret);
};

