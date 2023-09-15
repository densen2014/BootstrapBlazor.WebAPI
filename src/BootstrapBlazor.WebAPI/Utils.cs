﻿using System;
using System.Collections.Generic;
using System.IO.Ports;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BootstrapBlazor.Components;

static class Utils
{

    public static string convertToHexString(string str)
    {
        string hexString = "";
        char[] strChars = str.ToCharArray();
        foreach (char c in strChars)
        {
            hexString += Convert.ToByte(c).ToString("X2") + " ";
        }
        if (hexString.EndsWith(" "))
        {
            hexString = hexString.Substring(0, hexString.LastIndexOf(" "));
        }
        return hexString;
    }

    public static string convertHexStringToCommonString(string hexString)
    {
        if (hexString.Length == 0)
        {
            return "";
        }
        string commonString = "";

        if (hexString.EndsWith(" "))
        {
            hexString = hexString.Substring(0, hexString.LastIndexOf(" "));
        }
        //过滤掉非hex形式的字符
        for (int i = 0; i < hexString.ToCharArray().Length; i++)
        {
            char s = hexString[i];
            if ((s >= '0' && s <= '9') || (s >= 'A' && s <= 'F'))
            {
                hexString = hexString.Substring(i);
                break;
            }
        }
        String[] hexBytes = hexString.Split(' ');
        foreach (string hex in hexBytes)
        {
            int value = Convert.ToInt32(hex, 16);
            commonString += Convert.ToChar(value);
        }
        return commonString;
    }

    public static byte[]? convertHexStringToBytes(string hexString)
    {
        try
        {
            String[] hexBytes = hexString.Split(' ');
            byte[] bytes = new byte[hexBytes.Length];
            for (int i = 0; i < bytes.Length; i++)
            {
                int value = Convert.ToInt32(hexBytes[i], 16);
                bytes[i] = Convert.ToByte(value);
            }
            return bytes;
        }
        catch
        {
            return null;
        }
    }


}
