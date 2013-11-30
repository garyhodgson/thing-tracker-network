/**
 * 
 * Secure Hash Algorithm (SHA1) http://www.webtoolkit.info/
 * 
 */

function sha1 (msg, binary)
{

    function rotate_left (n, s)
    {
        var t4 = (n << s) | (n >>> (32 - s));
        return t4;
    };

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
    };

    function Utf8Encode (string)
    {
        string = string.replace (/\r\n/g, "\n");
        var utftext = "";

        for ( var n = 0; n < string.length; n++)
        {

            var c = string.charCodeAt (n);

            if (c < 128)
            {
                utftext += String.fromCharCode (c);
            }
            else if ((c > 127) && (c < 2048))
            {
                utftext += String.fromCharCode ((c >> 6) | 192);
                utftext += String.fromCharCode ((c & 63) | 128);
            }
            else
            {
                utftext += String.fromCharCode ((c >> 12) | 224);
                utftext += String.fromCharCode (((c >> 6) & 63) | 128);
                utftext += String.fromCharCode ((c & 63) | 128);
            }

        }

        return utftext;
    };

    var blockstart;
    var i, j;
    var W = new Array (80);
    var H0 = 0x67452301;
    var H1 = 0xEFCDAB89;
    var H2 = 0x98BADCFE;
    var H3 = 0x10325476;
    var H4 = 0xC3D2E1F0;
    var A, B, C, D, E;
    var temp;
    var ret;

    binary = binary | false;
    var word_array = new Array ();
    var msg_len;
    if (msg instanceof ArrayBuffer)
    {
        var view = new Uint8Array (msg);
        msg_len = view.byteLength;
        temp = msg_len - 3;
        for (i = 0; i < temp; i += 4)
        {
            j = view[i] << 24 | view[i + 1] << 16 | view[i + 2] << 8 | view[i + 3];
            word_array.push (j);
        }
    
        switch (msg_len % 4)
        {
            case 0:
                i = 0x080000000;
                break;
            case 1:
                i = view[msg_len - 1] << 24 | 0x0800000;
                break;
    
            case 2:
                i = view[msg_len - 2] << 24 | view[msg_len - 1] << 16 | 0x08000;
                break;
    
            case 3:
                i = view[msg_len - 3] << 24 | view[msg_len - 2] << 16 | view[msg_len - 1] << 8 | 0x80;
                break;
        }

        word_array.push (i);
    }
    else
    {
        msg = Utf8Encode (msg);
        msg_len = msg.length;
        temp = msg_len - 3;
        for (i = 0; i < temp; i += 4)
        {
            j = msg.charCodeAt (i) << 24 | msg.charCodeAt (i + 1) << 16 | msg.charCodeAt (i + 2) << 8 | msg.charCodeAt (i + 3);
            word_array.push (j);
        }
    
        switch (msg_len % 4)
        {
            case 0:
                i = 0x080000000;
                break;
            case 1:
                i = msg.charCodeAt (msg_len - 1) << 24 | 0x0800000;
                break;
    
            case 2:
                i = msg.charCodeAt (msg_len - 2) << 24 | msg.charCodeAt (msg_len - 1) << 16 | 0x08000;
                break;
    
            case 3:
                i = msg.charCodeAt (msg_len - 3) << 24 | msg.charCodeAt (msg_len - 2) << 16 | msg.charCodeAt (msg_len - 1) << 8 | 0x80;
                break;
        }

        word_array.push (i);
    }
    
    while ((word_array.length % 16) != 14)
        word_array.push (0);

    word_array.push (msg_len >>> 29);
    word_array.push ((msg_len << 3) & 0x0ffffffff);

    for (blockstart = 0; blockstart < word_array.length; blockstart += 16)
    {

        for (i = 0; i < 16; i++)
            W[i] = word_array[blockstart + i];
        for (i = 16; i <= 79; i++)
            W[i] = rotate_left (W[i - 3] ^ W[i - 8] ^ W[i - 14] ^ W[i - 16], 1);

        A = H0;
        B = H1;
        C = H2;
        D = H3;
        E = H4;

        for (i = 0; i <= 19; i++)
        {
            temp = (rotate_left (A, 5) + ((B & C) | (~B & D)) + E + W[i] + 0x5A827999) & 0x0ffffffff;
            E = D;
            D = C;
            C = rotate_left (B, 30);
            B = A;
            A = temp;
        }

        for (i = 20; i <= 39; i++)
        {
            temp = (rotate_left (A, 5) + (B ^ C ^ D) + E + W[i] + 0x6ED9EBA1) & 0x0ffffffff;
            E = D;
            D = C;
            C = rotate_left (B, 30);
            B = A;
            A = temp;
        }

        for (i = 40; i <= 59; i++)
        {
            temp = (rotate_left (A, 5) + ((B & C) | (B & D) | (C & D)) + E + W[i] + 0x8F1BBCDC) & 0x0ffffffff;
            E = D;
            D = C;
            C = rotate_left (B, 30);
            B = A;
            A = temp;
        }

        for (i = 60; i <= 79; i++)
        {
            temp = (rotate_left (A, 5) + (B ^ C ^ D) + E + W[i] + 0xCA62C1D6) & 0x0ffffffff;
            E = D;
            D = C;
            C = rotate_left (B, 30);
            B = A;
            A = temp;
        }

        H0 = (H0 + A) & 0x0ffffffff;
        H1 = (H1 + B) & 0x0ffffffff;
        H2 = (H2 + C) & 0x0ffffffff;
        H3 = (H3 + D) & 0x0ffffffff;
        H4 = (H4 + E) & 0x0ffffffff;

    }

    if (binary)
    {
        ret = new ArrayBuffer (20);
        temp = new Uint8Array (ret);
        temp[0] = (H0 >> 24) & 0xff;
        temp[1] = (H0 >> 16) & 0xff;
        temp[2] = (H0 >>  8) & 0xff;
        temp[3] = (H0      ) & 0xff;
        temp[4] = (H1 >> 24) & 0xff;
        temp[5] = (H1 >> 16) & 0xff;
        temp[6] = (H1 >>  8) & 0xff;
        temp[7] = (H1      ) & 0xff;
        temp[8] = (H2 >> 24) & 0xff;
        temp[9] = (H2 >> 16) & 0xff;
        temp[10] = (H2 >>  8) & 0xff;
        temp[11] = (H2      ) & 0xff;
        temp[12] = (H3 >> 24) & 0xff;
        temp[13] = (H3 >> 16) & 0xff;
        temp[14] = (H3 >>  8) & 0xff;
        temp[15] = (H3      ) & 0xff;
        temp[16] = (H4 >> 24) & 0xff;
        temp[17] = (H4 >> 16) & 0xff;
        temp[18] = (H4 >>  8) & 0xff;
        temp[19] = (H4      ) & 0xff;
    }
    else
    {
        temp = cvt_hex (H0) + cvt_hex (H1) + cvt_hex (H2) + cvt_hex (H3) + cvt_hex (H4);
        ret = temp.toLowerCase ();
    }

    return (ret);
}
