' =============================================================================
' HPO STREAM PACKAGE BUILDER - MAIN MODULE
' =============================================================================
' This module contains the core logic for the HPO Package Builder
' Save this file as a macro-enabled PowerPoint (.pptm)
' =============================================================================

Option Explicit

' Global constants for CPM rates
Public Const CPM_ADDRESSABLE As Double = 40
Public Const CPM_CUSTOM_NETS As Double = 35
Public Const CPM_AUDIENCE As Double = 29

' Path to Assets folder (relative to the PowerPoint file)
Public Const ASSETS_FOLDER As String = "Assets\"

' Data storage arrays
Public HPOData() As Variant      ' HPO name, Sport
Public DMAList() As Variant      ' DMA names
Public LiveCPMData() As Variant  ' HPO, CPM Rate
Public MaxImpsData() As Variant  ' DMA, HPO, Max Live Imps
Public DatesData() As Variant    ' HPO, Live Start, Live End, Support Start, Support End

' =============================================================================
' AUTO_OPEN - Triggers when the presentation is opened
' =============================================================================
Sub Auto_Open()
    ' Show the input form when the presentation opens
    Call ShowPackageBuilder
End Sub

' =============================================================================
' SHOW PACKAGE BUILDER - Entry point to display the UserForm
' =============================================================================
Public Sub ShowPackageBuilder()
    On Error GoTo ErrorHandler
    
    ' Load data from Excel files
    If Not LoadAllData() Then
        MsgBox "Error loading data files. Please ensure all Excel files are in the Assets folder.", vbCritical, "Data Load Error"
        Exit Sub
    End If
    
    ' Show the UserForm
    frmPackageBuilder.Show
    
    Exit Sub
    
ErrorHandler:
    MsgBox "Error initializing Package Builder: " & Err.Description, vbCritical, "Initialization Error"
End Sub

' =============================================================================
' LOAD ALL DATA - Reads all Excel files from Assets folder
' =============================================================================
Public Function LoadAllData() As Boolean
    On Error GoTo ErrorHandler
    
    Dim basePath As String
    basePath = ActivePresentation.Path & "\" & ASSETS_FOLDER
    
    ' Load HPOs
    If Not LoadHPOData(basePath & "HPOs.xlsx") Then GoTo ErrorHandler
    
    ' Load DMAs
    If Not LoadDMAData(basePath & "DMAs.xlsx") Then GoTo ErrorHandler
    
    ' Load Live CPM
    If Not LoadLiveCPMData(basePath & "Live CPM.xlsx") Then GoTo ErrorHandler
    
    ' Load Max Live Imps
    If Not LoadMaxImpsData(basePath & "Max Live Imps.xlsx") Then GoTo ErrorHandler
    
    ' Load Dates
    If Not LoadDatesData(basePath & "Dates.xlsx") Then GoTo ErrorHandler
    
    LoadAllData = True
    Exit Function
    
ErrorHandler:
    LoadAllData = False
End Function

' =============================================================================
' LOAD HPO DATA - Reads HPOs.xlsx
' =============================================================================
Private Function LoadHPOData(filePath As String) As Boolean
    On Error GoTo ErrorHandler
    
    Dim xlApp As Object, xlWb As Object, xlWs As Object
    Dim lastRow As Long, i As Long
    
    Set xlApp = CreateObject("Excel.Application")
    xlApp.Visible = False
    xlApp.DisplayAlerts = False
    
    Set xlWb = xlApp.Workbooks.Open(filePath, ReadOnly:=True)
    Set xlWs = xlWb.Sheets(1)
    
    lastRow = xlWs.Cells(xlWs.Rows.Count, 1).End(-4162).Row ' xlUp = -4162
    
    ReDim HPOData(1 To lastRow - 1, 1 To 2)
    
    For i = 2 To lastRow
        HPOData(i - 1, 1) = xlWs.Cells(i, 1).Value ' HPO Name
        HPOData(i - 1, 2) = xlWs.Cells(i, 2).Value ' Sport
    Next i
    
    xlWb.Close False
    xlApp.Quit
    Set xlWs = Nothing
    Set xlWb = Nothing
    Set xlApp = Nothing
    
    LoadHPOData = True
    Exit Function
    
ErrorHandler:
    LoadHPOData = False
    On Error Resume Next
    If Not xlWb Is Nothing Then xlWb.Close False
    If Not xlApp Is Nothing Then xlApp.Quit
End Function

' =============================================================================
' LOAD DMA DATA - Reads DMAs.xlsx
' =============================================================================
Private Function LoadDMAData(filePath As String) As Boolean
    On Error GoTo ErrorHandler
    
    Dim xlApp As Object, xlWb As Object, xlWs As Object
    Dim lastRow As Long, i As Long
    
    Set xlApp = CreateObject("Excel.Application")
    xlApp.Visible = False
    xlApp.DisplayAlerts = False
    
    Set xlWb = xlApp.Workbooks.Open(filePath, ReadOnly:=True)
    Set xlWs = xlWb.Sheets(1)
    
    lastRow = xlWs.Cells(xlWs.Rows.Count, 1).End(-4162).Row
    
    ReDim DMAList(1 To lastRow - 1)
    
    For i = 2 To lastRow
        DMAList(i - 1) = xlWs.Cells(i, 1).Value
    Next i
    
    xlWb.Close False
    xlApp.Quit
    Set xlWs = Nothing
    Set xlWb = Nothing
    Set xlApp = Nothing
    
    LoadDMAData = True
    Exit Function
    
ErrorHandler:
    LoadDMAData = False
    On Error Resume Next
    If Not xlWb Is Nothing Then xlWb.Close False
    If Not xlApp Is Nothing Then xlApp.Quit
End Function

' =============================================================================
' LOAD LIVE CPM DATA - Reads Live CPM.xlsx
' =============================================================================
Private Function LoadLiveCPMData(filePath As String) As Boolean
    On Error GoTo ErrorHandler
    
    Dim xlApp As Object, xlWb As Object, xlWs As Object
    Dim lastRow As Long, i As Long
    
    Set xlApp = CreateObject("Excel.Application")
    xlApp.Visible = False
    xlApp.DisplayAlerts = False
    
    Set xlWb = xlApp.Workbooks.Open(filePath, ReadOnly:=True)
    Set xlWs = xlWb.Sheets(1)
    
    lastRow = xlWs.Cells(xlWs.Rows.Count, 1).End(-4162).Row
    
    ReDim LiveCPMData(1 To lastRow - 1, 1 To 2)
    
    For i = 2 To lastRow
        LiveCPMData(i - 1, 1) = xlWs.Cells(i, 1).Value ' HPO Name
        LiveCPMData(i - 1, 2) = xlWs.Cells(i, 2).Value ' Rate
    Next i
    
    xlWb.Close False
    xlApp.Quit
    Set xlWs = Nothing
    Set xlWb = Nothing
    Set xlApp = Nothing
    
    LoadLiveCPMData = True
    Exit Function
    
ErrorHandler:
    LoadLiveCPMData = False
    On Error Resume Next
    If Not xlWb Is Nothing Then xlWb.Close False
    If Not xlApp Is Nothing Then xlApp.Quit
End Function

' =============================================================================
' LOAD MAX IMPS DATA - Reads Max Live Imps.xlsx
' =============================================================================
Private Function LoadMaxImpsData(filePath As String) As Boolean
    On Error GoTo ErrorHandler
    
    Dim xlApp As Object, xlWb As Object, xlWs As Object
    Dim lastRow As Long, i As Long
    
    Set xlApp = CreateObject("Excel.Application")
    xlApp.Visible = False
    xlApp.DisplayAlerts = False
    
    Set xlWb = xlApp.Workbooks.Open(filePath, ReadOnly:=True)
    Set xlWs = xlWb.Sheets(1)
    
    lastRow = xlWs.Cells(xlWs.Rows.Count, 1).End(-4162).Row
    
    ReDim MaxImpsData(1 To lastRow - 1, 1 To 3)
    
    For i = 2 To lastRow
        MaxImpsData(i - 1, 1) = xlWs.Cells(i, 1).Value ' Standard DMA
        MaxImpsData(i - 1, 2) = xlWs.Cells(i, 2).Value ' HPO + Season
        MaxImpsData(i - 1, 3) = xlWs.Cells(i, 4).Value ' Max Live Imps
    Next i
    
    xlWb.Close False
    xlApp.Quit
    Set xlWs = Nothing
    Set xlWb = Nothing
    Set xlApp = Nothing
    
    LoadMaxImpsData = True
    Exit Function
    
ErrorHandler:
    LoadMaxImpsData = False
    On Error Resume Next
    If Not xlWb Is Nothing Then xlWb.Close False
    If Not xlApp Is Nothing Then xlApp.Quit
End Function

' =============================================================================
' LOAD DATES DATA - Reads Dates.xlsx
' =============================================================================
Private Function LoadDatesData(filePath As String) As Boolean
    On Error GoTo ErrorHandler
    
    Dim xlApp As Object, xlWb As Object, xlWs As Object
    Dim lastRow As Long, i As Long
    
    Set xlApp = CreateObject("Excel.Application")
    xlApp.Visible = False
    xlApp.DisplayAlerts = False
    
    Set xlWb = xlApp.Workbooks.Open(filePath, ReadOnly:=True)
    Set xlWs = xlWb.Sheets(1)
    
    lastRow = xlWs.Cells(xlWs.Rows.Count, 1).End(-4162).Row
    
    ReDim DatesData(1 To lastRow - 1, 1 To 5)
    
    For i = 2 To lastRow
        DatesData(i - 1, 1) = xlWs.Cells(i, 1).Value ' HPO
        DatesData(i - 1, 2) = xlWs.Cells(i, 4).Value ' Live Range
        DatesData(i - 1, 3) = xlWs.Cells(i, 7).Value ' Support Range
    Next i
    
    xlWb.Close False
    xlApp.Quit
    Set xlWs = Nothing
    Set xlWb = Nothing
    Set xlApp = Nothing
    
    LoadDatesData = True
    Exit Function
    
ErrorHandler:
    LoadDatesData = False
    On Error Resume Next
    If Not xlWb Is Nothing Then xlWb.Close False
    If Not xlApp Is Nothing Then xlApp.Quit
End Function

' =============================================================================
' GET LIVE CPM - Returns the Live CPM for a given HPO
' =============================================================================
Public Function GetLiveCPM(hpoName As String) As Double
    Dim i As Long
    
    For i = LBound(LiveCPMData, 1) To UBound(LiveCPMData, 1)
        If Trim(LiveCPMData(i, 1)) = Trim(hpoName) Then
            GetLiveCPM = CDbl(LiveCPMData(i, 2))
            Exit Function
        End If
    Next i
    
    GetLiveCPM = 0 ' Not found
End Function

' =============================================================================
' GET MAX LIVE IMPS - Returns the Max Live Imps for a given DMA and HPO
' =============================================================================
Public Function GetMaxLiveImps(dmaName As String, hpoName As String) As Double
    Dim i As Long
    
    For i = LBound(MaxImpsData, 1) To UBound(MaxImpsData, 1)
        If Trim(MaxImpsData(i, 1)) = Trim(dmaName) And _
           Trim(MaxImpsData(i, 2)) = Trim(hpoName) Then
            GetMaxLiveImps = CDbl(MaxImpsData(i, 3))
            Exit Function
        End If
    Next i
    
    GetMaxLiveImps = -1 ' Not found (indicates no limit or error)
End Function

' =============================================================================
' GET SPORT - Returns the Sport name for a given HPO
' =============================================================================
Public Function GetSport(hpoName As String) As String
    Dim i As Long
    
    For i = LBound(HPOData, 1) To UBound(HPOData, 1)
        If Trim(HPOData(i, 1)) = Trim(hpoName) Then
            GetSport = Trim(HPOData(i, 2))
            Exit Function
        End If
    Next i
    
    GetSport = "" ' Not found
End Function

' =============================================================================
' GET DATES - Returns Live and Support date ranges for a given HPO
' =============================================================================
Public Sub GetDates(hpoName As String, ByRef liveRange As String, ByRef supportRange As String)
    Dim i As Long
    
    liveRange = ""
    supportRange = ""
    
    For i = LBound(DatesData, 1) To UBound(DatesData, 1)
        If Trim(DatesData(i, 1)) = Trim(hpoName) Then
            liveRange = CStr(DatesData(i, 2))
            supportRange = CStr(DatesData(i, 3))
            Exit Sub
        End If
    Next i
End Sub

' =============================================================================
' FORMAT NUMBER WITH COMMAS - Formats a number with thousand separators
' =============================================================================
Public Function FormatWithCommas(num As Double) As String
    FormatWithCommas = Format(num, "#,##0")
End Function

' =============================================================================
' FORMAT CURRENCY - Formats a number as currency
' =============================================================================
Public Function FormatCurrency(num As Double) As String
    FormatCurrency = "$" & Format(num, "#,##0")
End Function

' =============================================================================
' CALCULATE PACKAGE - Main calculation logic
' =============================================================================
Public Function CalculatePackage(hpoName As String, dmaName As String, budget As Double, _
                                  ByRef result As Variant) As Boolean
    On Error GoTo ErrorHandler
    
    Dim liveCPM As Double
    Dim maxLiveImps As Double
    Dim liveBudget As Double
    Dim supportBudget As Double
    Dim calcLiveImps As Double
    Dim sport As String
    Dim liveRange As String
    Dim supportRange As String
    
    ' Initialize result dictionary
    Set result = CreateObject("Scripting.Dictionary")
    
    ' Get Live CPM for this HPO
    liveCPM = GetLiveCPM(hpoName)
    If liveCPM = 0 Then
        MsgBox "Live CPM not found for " & hpoName, vbExclamation, "Data Error"
        CalculatePackage = False
        Exit Function
    End If
    
    ' Get Max Live Imps for this DMA/HPO combination
    maxLiveImps = GetMaxLiveImps(dmaName, hpoName)
    
    ' Get Sport name
    sport = GetSport(hpoName)
    
    ' Get date ranges
    Call GetDates(hpoName, liveRange, supportRange)
    
    ' Calculate Live budget (50% of total)
    liveBudget = budget * 0.5
    supportBudget = budget * 0.5
    
    ' Calculate Live Impressions
    ' Formula: Impressions = (Budget / CPM) * 1000
    calcLiveImps = (liveBudget / liveCPM) * 1000
    
    ' Check against max
    If maxLiveImps > 0 And calcLiveImps > maxLiveImps Then
        MsgBox "Budget is too large for this DMA/HPO combination." & vbCrLf & _
               "Calculated Live Imps: " & FormatWithCommas(calcLiveImps) & vbCrLf & _
               "Maximum Allowed: " & FormatWithCommas(maxLiveImps), vbExclamation, "Budget Too Large"
        CalculatePackage = False
        Exit Function
    End If
    
    ' Calculate support package impressions
    Dim supportBudgetPerPackage As Double
    supportBudgetPerPackage = supportBudget / 3  ' Divide equally among 3 packages
    
    Dim addressableImps As Double
    Dim customNetsImps As Double
    Dim audienceImps As Double
    
    addressableImps = (supportBudgetPerPackage / CPM_ADDRESSABLE) * 1000
    customNetsImps = (supportBudgetPerPackage / CPM_CUSTOM_NETS) * 1000
    audienceImps = (supportBudgetPerPackage / CPM_AUDIENCE) * 1000
    
    ' Calculate totals for each package option
    Dim totalImps1 As Double, totalImps2 As Double, totalImps3 As Double
    Dim totalInv1 As Double, totalInv2 As Double, totalInv3 As Double
    Dim eCPM1 As Double, eCPM2 As Double, eCPM3 As Double
    
    ' Option 1: Live + Addressable
    totalImps1 = calcLiveImps + addressableImps
    totalInv1 = liveBudget + supportBudgetPerPackage
    eCPM1 = (totalInv1 / totalImps1) * 1000
    
    ' Option 2: Live + Custom Nets
    totalImps2 = calcLiveImps + customNetsImps
    totalInv2 = liveBudget + supportBudgetPerPackage
    eCPM2 = (totalInv2 / totalImps2) * 1000
    
    ' Option 3: Live + Audience
    totalImps3 = calcLiveImps + audienceImps
    totalInv3 = liveBudget + supportBudgetPerPackage
    eCPM3 = (totalInv3 / totalImps3) * 1000
    
    ' Store all results
    result.Add "DMA", dmaName
    result.Add "HPO", hpoName
    result.Add "Sport", sport
    result.Add "LiveRange", liveRange
    result.Add "SupportRange", supportRange
    result.Add "LiveCPM", liveCPM
    result.Add "LiveImps", calcLiveImps
    result.Add "LiveBudget", liveBudget
    
    result.Add "AddressableImps", addressableImps
    result.Add "CustomNetsImps", customNetsImps
    result.Add "AudienceImps", audienceImps
    
    result.Add "TotalImps1", totalImps1
    result.Add "TotalInv1", totalInv1
    result.Add "eCPM1", eCPM1
    
    result.Add "TotalImps2", totalImps2
    result.Add "TotalInv2", totalInv2
    result.Add "eCPM2", eCPM2
    
    result.Add "TotalImps3", totalImps3
    result.Add "TotalInv3", totalInv3
    result.Add "eCPM3", eCPM3
    
    CalculatePackage = True
    Exit Function
    
ErrorHandler:
    CalculatePackage = False
End Function
