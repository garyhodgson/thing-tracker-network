
/*
 * make it so:
   {
        "announce": ...,
        "info": { ... },
        "signatures": {
            "net.thingtracker": {
                "certificate": optional, DER encoded x.509 certificate,
                "info": { ... } optional,
                "signature": signed data = info + sig info if present
            },
            ...
        }
    }

 */

function hex2buffer (s)
{
    var i;
    var j;
    var view;
    var ret;
    
    limit = s.length;
    ret = new ArrayBuffer (limit / 2);
    view = new Uint8Array (ret);
    for (i = 0, j = 0; i < limit; i += 2)
        view[j++] = HexConverter.hex2dec (s.substr (i, 2));

    return (ret);
}

function SignTorrent (torrent)
{
    // PEM serialized RSA private key
    var privatekey = "-----BEGIN RSA PRIVATE KEY-----" +
        "MIICXQIBAAKBgQC/875gQ3CrLKmf6Ag/sLtK/Y0wnEmzwBOSJY1ecGBoLrPc6Hdc" +
        "NCK0eAwcB70A62VBOQZJ4mbyQwKmCaIUNDzBnDAO4p+5UCB4WWvwIILBXDRR2bP8" +
        "fzcVkP7AFylUxwYZShJz1FS0PQb//i6jav9Q4oZuzveUVR/oJuSIF9n2OwIDAQAB" +
        "AoGAMUmpDJbEi2+Abqrp01DSBsNsSZsX4avkWpaB4koAtz+mt4aJf4dzkdtxYJEs" +
        "GtxWt5So5LfZr0M9ntzCXWW8Y5gyoErXXErZ8dR9pnyuinxZ3Cg6bKQnwYqoEYQi" +
        "XpDpAm+ACcj68MstMcn8LdrUfoga0zBHcd9CM8Xp6T1zduECQQDxV+KEHquj+887" +
        "zfv3Ed0jRSNfdn4snOOHYQbD1WMV/XyI/TQG7dQC/iHNNoHpJr14oSFPVMUAMVa4" +
        "OsViDuSNAkEAy5v7+GbHarHDfOriilxluugdd+N7TT3MQg+x9Z6BnXIy3aUz+1VS" +
        "5geyc7FdGGqY8SWSdNNGf2edijP3S4ln5wJBAJZkRKQ+FIlIVjgXQQcSW7Ip2EQZ" +
        "q8CTN3naLYQFSgye/GbFGhGjTHVc9aVSbRvj5zfveLldwrE/DaIaBXv4edUCQQC4" +
        "/x8vkWL7REzUgS4YfN9JtYCg36W2hsHB/DS7cKtf/NTOoj3azKmnq7Kuf6aQero/" +
        "0N2DHDvfoqt3WMQGc/BdAkBFHysNWAIqF3qZYpsFKip9anfB0xWLi/YRUE0IoCXi" +
        "LrvSlhBrIatVmU1NzJetJNXtMqyOFfTJTJDtJOkritTQ" +
        "-----END RSA PRIVATE KEY-----";
    var certificate = "-----BEGIN CERTIFICATE-----" +
        "MIIE/zCCAuegAwIBAgIDDeFpMA0GCSqGSIb3DQEBBQUAMHkxEDAOBgNVBAoTB1Jv" +
        "b3QgQ0ExHjAcBgNVBAsTFWh0dHA6Ly93d3cuY2FjZXJ0Lm9yZzEiMCAGA1UEAxMZ" +
        "Q0EgQ2VydCBTaWduaW5nIEF1dGhvcml0eTEhMB8GCSqGSIb3DQEJARYSc3VwcG9y" +
        "dEBjYWNlcnQub3JnMB4XDTEzMTAwMTE1MzYxOVoXDTE0MDMzMDE1MzYxOVowQzEY" +
        "MBYGA1UEAxMPQ0FjZXJ0IFdvVCBVc2VyMScwJQYJKoZIhvcNAQkBFhhkZXJyaWNr" +
        "Lm9zd2FsZEBnbWFpbC5jb20wgZ8wDQYJKoZIhvcNAQEBBQADgY0AMIGJAoGBAL/z" +
        "vmBDcKssqZ/oCD+wu0r9jTCcSbPAE5IljV5wYGgus9zod1w0IrR4DBwHvQDrZUE5" +
        "BkniZvJDAqYJohQ0PMGcMA7in7lQIHhZa/AggsFcNFHZs/x/NxWQ/sAXKVTHBhlK" +
        "EnPUVLQ9Bv/+LqNq/1Dihm7O95RVH+gm5IgX2fY7AgMBAAGjggFIMIIBRDAMBgNV" +
        "HRMBAf8EAjAAMFYGCWCGSAGG+EIBDQRJFkdUbyBnZXQgeW91ciBvd24gY2VydGlm" +
        "aWNhdGUgZm9yIEZSRUUgaGVhZCBvdmVyIHRvIGh0dHA6Ly93d3cuQ0FjZXJ0Lm9y" +
        "ZzAOBgNVHQ8BAf8EBAMCA6gwQAYDVR0lBDkwNwYIKwYBBQUHAwQGCCsGAQUFBwMC" +
        "BgorBgEEAYI3CgMEBgorBgEEAYI3CgMDBglghkgBhvhCBAEwMgYIKwYBBQUHAQEE" +
        "JjAkMCIGCCsGAQUFBzABhhZodHRwOi8vb2NzcC5jYWNlcnQub3JnMDEGA1UdHwQq" +
        "MCgwJqAkoCKGIGh0dHA6Ly9jcmwuY2FjZXJ0Lm9yZy9yZXZva2UuY3JsMCMGA1Ud" +
        "EQQcMBqBGGRlcnJpY2sub3N3YWxkQGdtYWlsLmNvbTANBgkqhkiG9w0BAQUFAAOC" +
        "AgEAWbvHj+d+OlhDW3OdWIF6bzapS2zyr5eAb1+5SaDCIXjwO/DwtAtxhHIigYi1" +
        "Nf8yOafoqyIAgWj9NCo8gboEXLkDNSMiDkZew84X3LckDr3FH6Xs23PjIAjKLhcT" +
        "B0e2e7XSiNOcZlh/2BSWOzE9d3vAYPK/vfWiU2cde9Y38WKGm2FItkGTgJ6I9mt7" +
        "Y9mxkYmlSUy/iJcu+uez8Gs0xRYIsrjB+17gpox4+dJVPWBdLE+YNGTtvdOdvLU3" +
        "g9n/D6WewQt0iAcwNMGbhpFahL5Cw5WMwvytT1ZWq6WvJegUNxz8cWWBT8C1AIjp" +
        "1JusGTvQq68StbpxYnL/PqyNs2F6KzFvy08Q+FkHPE+1wdZs/VJqrU86q4qjRYEn" +
        "uLr4gowHYtsTb2z4XP4JbVDTpKocfCz/RmefMsCcJkKgER+PFtL+TPQiTr2yNS1F" +
        "oMDEsQqsikCj0zpqul73uRzlz1Kazr9ODnpyNKdB3hI+E3maOjJyBPCfxv3Qkiiy" +
        "7vezNlshxcOXyTZsjCNtph31EtKmqDjst6zmDa0k+IAniIzp7s05R9APobv+rN2S" +
        "VGcdtbUuU6dAmdC14SFHtHP4OCLNN/siqEWA2smTQjUX52po2ilI/QHVhB11AtPn" +
        "tiVNNk2MZ6PDp0Kfzmf0FfT1TJELXrsM4VuQVsqdhDBDvmI=" +
        "-----END CERTIFICATE-----";
    var secrettext = "2013/10/01 http://www.cbc.ca/news/world/key-obamacare-law-kicks-in-amid-confusion-and-shutdown-1.1874959";
    var rsa = new RSAKey ();
    rsa.readPrivateKeyFromPEMString (privatekey); // ToDo: get the private key from the form

    var info = torrent["info"];
    // create the second info section
    // ToDo: should the sha1 hashes be binary ?
    var info2 = {};
    var sigs = torrent["signatures"];
    sigs = sigs || {};
    var ancestors = {};
    ancestors["v1.0.0"] = {};
    ancestors["v1.0.0"]["nonce"] = "2013/09/12 http://www.cbc.ca/news/world/story/2013/09/11/f-vp-macdonald-syria-obama.html";
    ancestors["v1.0.0"]["hash"] = sha1 (ancestors["v1.0.0"]["nonce"]);
    ancestors["v1.1.0"] = {};
    ancestors["v1.1.0"]["nonce"] = "2013/09/24 http://www.cbc.ca/news/world/kenya-mall-attack-most-hostages-freed-military-says-1.1863653";
    ancestors["v1.1.0"]["hash"] = sha1 (ancestors["v1.1.0"]["nonce"]);
    info2["ancestors"] = ancestors;
    
    var me = {};
    me["v2.0.0"] = {};
    me["v2.0.0"]["nonce"] = "2013/09/29 http://www.cbc.ca/news/world/u-s-house-votes-for-obamacare-delay-as-shutdown-looms-1.1872342";
    me["v2.0.0"]["hash"] = sha1 (me["v2.0.0"]["nonce"]);
    info2["current"] = me;
    
    var secret = {};
    secret["hash"] = sha1 (secrettext);
    info2["descendent"] = secret;
    
    // sign the two encoded info sections
    // ToDo: check the signature produced here against the one generated by ut-signing-tool (https://github.com/bittorrent/ut-signing-tool)
    var i1 = encode (info);
    var i2 = encode (info2);
    var signature = hex2buffer (rsa.signString (i1 + i2, "sha1"));
    
    var sig = {};
    // DER encode the PEM encoded x.509 certificate:
    sig["certificate"] = hex2buffer (X509.pemToHex (certificate));
    sig["info"] = info2;
    sig["signature"] = signature;
    sigs["net.thingtracker"] = sig;
    torrent["signatures"] = sigs;
}