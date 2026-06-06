$Win32Code = @"
using System;
using System.Runtime.InteropServices;
using System.Collections.Generic;
using System.Text;

public class Win32 {
    [DllImport("user32.dll")]
    public static extern bool EnumWindows(EnumWindowsProc lpEnumFunc, IntPtr lParam);

    public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);

    [DllImport("user32.dll", CharSet = CharSet.Auto)]
    public static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);

    public static List<string> GetAllTitles() {
        List<string> titles = new List<string>();
        EnumWindows(delegate (IntPtr h, IntPtr l) {
            StringBuilder b = new StringBuilder(512);
            GetWindowText(h, b, 512);
            string title = b.ToString();
            if (!string.IsNullOrEmpty(title)) {
                titles.Add(title);
            }
            return true;
        }, IntPtr.Zero);
        return titles;
    }
}
"@
Add-Type -TypeDefinition $Win32Code
[Win32]::GetAllTitles() | Where-Object { $_ -like "*WhatsApp*" -or $_ -like "*Edge*" -or $_ -like "*Chrome*" } | Out-File "g:\bobby\GitHub\FIT OpBal Fix - Copy\scripts\window_debug.txt"
