' =============================================================================
' HPO STREAM PACKAGE BUILDER - PRESENTATION UPDATE MODULE
' =============================================================================
' This module handles updating the PowerPoint presentation with calculated values
' =============================================================================

Option Explicit

' =============================================================================
' GENERATE OUTPUT FILE - Creates output presentation using Package Builder template
' =============================================================================
Public Sub GenerateOutputFile(hpoName As String, dmaName As String, result As Variant)
    On Error GoTo ErrorHandler
    
    Dim packageBuilderPath As String
    Dim outputPath As String
    Dim outputPres As Presentation
    Dim basePath As String
    Dim useActivePres As Boolean
    
    basePath = ActivePresentation.Path
    useActivePres = False
    
    ' Use the Package Builder template as the base (it has the XXX placeholders)
    ' First try the Package Builder file in the same folder
    packageBuilderPath = basePath & "\HPO Stream Package Builder.pptx"
    
    ' Check if Package Builder exists
    If Dir(packageBuilderPath) = "" Then
        ' Try looking in Assets folder
        packageBuilderPath = basePath & "\" & ASSETS_FOLDER & "HPO Stream Package Builder.pptx"
        If Dir(packageBuilderPath) = "" Then
            ' Use the active presentation itself as the template
            ' (This works when running from the Package Builder file directly)
            useActivePres = True
        End If
    End If
    
    If useActivePres Then
        ' Create a copy of the active presentation for output
        outputPath = basePath & "\Output\" & _
                     SanitizeFileName(dmaName) & "_" & _
                     SanitizeFileName(hpoName) & "_Package.pptx"
        
        ' Create Output folder if it doesn't exist
        On Error Resume Next
        MkDir basePath & "\Output"
        On Error GoTo ErrorHandler
        
        ' Save a copy first
        ActivePresentation.SaveCopyAs outputPath
        
        ' Open the copy
        Set outputPres = Presentations.Open(outputPath, ReadOnly:=msoFalse, WithWindow:=msoFalse)
    Else
        ' Open Package Builder template as the base
        Set outputPres = Presentations.Open(packageBuilderPath, ReadOnly:=msoTrue, WithWindow:=msoFalse)
        
        ' Generate output filename
        outputPath = basePath & "\Output\" & _
                     SanitizeFileName(dmaName) & "_" & _
                     SanitizeFileName(hpoName) & "_Package.pptx"
        
        ' Create Output folder if it doesn't exist
        On Error Resume Next
        MkDir basePath & "\Output"
        On Error GoTo ErrorHandler
    End If
    
    ' Apply all calculated values to the presentation
    ApplyPackageToTemplate outputPres, result
    
    ' Save the output file
    If useActivePres Then
        outputPres.Save
    Else
        outputPres.SaveAs outputPath
    End If
    
    outputPres.Close
    
    MsgBox "Package created successfully!" & vbCrLf & vbCrLf & _
           "Output file: " & outputPath, vbInformation, "Success"
    
    Exit Sub
    
ErrorHandler:
    MsgBox "Error generating output file: " & Err.Description, vbCritical, "Output Error"
    On Error Resume Next
    If Not outputPres Is Nothing Then outputPres.Close
End Sub

' =============================================================================
' APPLY PACKAGE TO TEMPLATE - Updates template with calculated values
' Uses smart detection to determine which section each shape belongs to
' =============================================================================
Private Sub ApplyPackageToTemplate(pres As Presentation, result As Variant)
    Dim sld As Slide
    Dim shp As Shape
    Dim txt As String
    Dim isLiveSection As Boolean
    Dim isOption1 As Boolean
    Dim isOption2 As Boolean
    Dim isOption3 As Boolean
    
    For Each sld In pres.Slides
        For Each shp In sld.Shapes
            If shp.HasTextFrame Then
                If shp.TextFrame.HasText Then
                    txt = shp.TextFrame.TextRange.Text
                    
                    ' =============================================
                    ' UNIVERSAL REPLACEMENTS (apply to all text)
                    ' =============================================
                    
                    ' Replace DMA placeholders
                    txt = Replace(txt, "XXX DMA", result("DMA") & " DMA")
                    
                    ' Replace Sport placeholders
                    txt = Replace(txt, "XXX broadcasts", result("Sport") & " broadcasts")
                    txt = Replace(txt, "XXX Broadcasts", result("Sport") & " Broadcasts")
                    txt = Replace(txt, "XXX viewers", result("Sport") & " viewers")
                    txt = Replace(txt, "XXX Viewers", result("Sport") & " Viewers")
                    
                    ' =============================================
                    ' SECTION-SPECIFIC REPLACEMENTS
                    ' =============================================
                    
                    ' Determine which section this shape belongs to
                    ' Live section contains "$XX CPM" or "XXX,XXX Impressions"
                    ' Option sections contain the hardcoded CPMs ($40, $35, $29)
                    
                    isLiveSection = (InStr(txt, "$XX CPM") > 0) Or (InStr(txt, "XXX,XXX Impressions") > 0)
                    isOption1 = (InStr(txt, "$40 CPM") > 0)
                    isOption2 = (InStr(txt, "$35 CPM") > 0)
                    isOption3 = (InStr(txt, "$29 CPM") > 0)
                    
                    ' Replace date patterns based on section
                    If isLiveSection Then
                        ' Live section dates
                        txt = ReplaceDatePattern(txt, CStr(result("LiveRange")))
                    ElseIf isOption1 Or isOption2 Or isOption3 Then
                        ' Support section dates
                        txt = ReplaceDatePattern(txt, CStr(result("SupportRange")))
                    End If
                    
                    ' Replace Live CPM and Impressions
                    If InStr(txt, "$XX CPM") > 0 Then
                        txt = Replace(txt, "$XX CPM", "$" & Format(result("LiveCPM"), "0") & " CPM")
                    End If
                    
                    If InStr(txt, "XXX,XXX Impressions") > 0 Then
                        txt = Replace(txt, "XXX,XXX Impressions", FormatWithCommas(CDbl(result("LiveImps"))) & " Impressions")
                    End If
                    
                    ' Replace Support Imps for each option
                    If isOption1 And InStr(txt, "XXX,XXX Imps") > 0 Then
                        txt = Replace(txt, "XXX,XXX Imps", FormatWithCommas(CDbl(result("AddressableImps"))) & " Imps")
                    ElseIf isOption2 And InStr(txt, "XXX,XXX Imps") > 0 Then
                        txt = Replace(txt, "XXX,XXX Imps", FormatWithCommas(CDbl(result("CustomNetsImps"))) & " Imps")
                    ElseIf isOption3 And InStr(txt, "XXX,XXX Imps") > 0 Then
                        txt = Replace(txt, "XXX,XXX Imps", FormatWithCommas(CDbl(result("AudienceImps"))) & " Imps")
                    End If
                    
                    ' Replace Package Totals for each option
                    If isOption1 Then
                        txt = ReplacePackageTotals(txt, CDbl(result("TotalImps1")), CDbl(result("TotalInv1")), CDbl(result("eCPM1")))
                    ElseIf isOption2 Then
                        txt = ReplacePackageTotals(txt, CDbl(result("TotalImps2")), CDbl(result("TotalInv2")), CDbl(result("eCPM2")))
                    ElseIf isOption3 Then
                        txt = ReplacePackageTotals(txt, CDbl(result("TotalImps3")), CDbl(result("TotalInv3")), CDbl(result("eCPM3")))
                    End If
                    
                    ' =============================================
                    ' HANDLE SHAPES WITH MIXED/UNKNOWN CONTENT
                    ' =============================================
                    ' If a shape has date patterns but wasn't identified as live or option,
                    ' try to identify by other markers and replace accordingly
                    If InStr(txt, "X/XX/XX") > 0 Then
                        ' Check for "Package Total" which indicates support section
                        If InStr(txt, "Package Total") > 0 Then
                            txt = ReplaceDatePattern(txt, CStr(result("SupportRange")))
                        ElseIf InStr(txt, "in-telecast") > 0 Or InStr(txt, "In-Telecast") > 0 Then
                            txt = ReplaceDatePattern(txt, CStr(result("LiveRange")))
                        End If
                    End If
                    
                    ' Update the shape text
                    shp.TextFrame.TextRange.Text = txt
                End If
            End If
        Next shp
    Next sld
End Sub

' =============================================================================
' REPLACE DATE PATTERN - Replaces X/XX/XX – X/XX/XX with actual date range
' =============================================================================
Private Function ReplaceDatePattern(source As String, dateRange As String) As String
    Dim txt As String
    txt = source
    
    ' Try en-dash variant (–)
    If InStr(txt, "X/XX/XX – X/XX/XX") > 0 Then
        txt = Replace(txt, "X/XX/XX – X/XX/XX", dateRange)
    End If
    
    ' Try regular hyphen variant (-)
    If InStr(txt, "X/XX/XX - X/XX/XX") > 0 Then
        txt = Replace(txt, "X/XX/XX - X/XX/XX", dateRange)
    End If
    
    ReplaceDatePattern = txt
End Function

' =============================================================================
' REPLACE PACKAGE TOTALS - Replaces Package Total Imps, Investment, and eCPM
' =============================================================================
Private Function ReplacePackageTotals(source As String, totalImps As Double, totalInv As Double, eCPM As Double) As String
    Dim txt As String
    txt = source
    
    ' Replace Package Total Imps
    If InStr(txt, "Package Total Imps: XXX,XXX") > 0 Then
        txt = Replace(txt, "Package Total Imps: XXX,XXX", "Package Total Imps: " & FormatWithCommas(totalImps))
    End If
    
    ' Replace Package Total Investment
    If InStr(txt, "Package Total Investment: $XX,XXX") > 0 Then
        txt = Replace(txt, "Package Total Investment: $XX,XXX", "Package Total Investment: " & FormatCurrency(totalInv))
    End If
    
    ' Replace Package eCPM
    If InStr(txt, "Package eCPM: $XX") > 0 Then
        txt = Replace(txt, "Package eCPM: $XX", "Package eCPM: $" & Format(eCPM, "0.00"))
    End If
    
    ReplacePackageTotals = txt
End Function

' =============================================================================
' SANITIZE FILE NAME - Removes invalid characters from filename
' =============================================================================
Private Function SanitizeFileName(fileName As String) As String
    Dim txt As String
    txt = fileName
    
    ' Replace invalid characters
    txt = Replace(txt, "\", "_")
    txt = Replace(txt, "/", "_")
    txt = Replace(txt, ":", "_")
    txt = Replace(txt, "*", "_")
    txt = Replace(txt, "?", "_")
    txt = Replace(txt, """", "_")
    txt = Replace(txt, "<", "_")
    txt = Replace(txt, ">", "_")
    txt = Replace(txt, "|", "_")
    txt = Replace(txt, "'", "_")
    
    SanitizeFileName = txt
End Function
