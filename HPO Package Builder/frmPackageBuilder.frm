' =============================================================================
' HPO STREAM PACKAGE BUILDER - USER FORM CODE
' =============================================================================
' This is the code for frmPackageBuilder UserForm
' UserForm should contain:
'   - cboHPO (ComboBox) - Dropdown for HPO selection
'   - cboDMA (ComboBox) - Dropdown for DMA selection
'   - txtBudget (TextBox) - Input for budget
'   - lblBudget (Label) - Label for budget field
'   - cmdGenerate (CommandButton) - Generate button
'   - cmdCancel (CommandButton) - Cancel button
'   - fraInfo (Frame) - Information frame (optional)
' =============================================================================

Option Explicit

' =============================================================================
' USERFORM INITIALIZE - Populates dropdowns when form loads
' =============================================================================
Private Sub UserForm_Initialize()
    On Error GoTo ErrorHandler
    
    Dim i As Long
    
    ' Set form properties
    Me.Caption = "HPO Stream Package Builder"
    
    ' Populate HPO dropdown
    cboHPO.Clear
    For i = LBound(HPOData, 1) To UBound(HPOData, 1)
        cboHPO.AddItem HPOData(i, 1)
    Next i
    
    ' Populate DMA dropdown
    cboDMA.Clear
    For i = LBound(DMAList) To UBound(DMAList)
        cboDMA.AddItem DMAList(i)
    Next i
    
    ' Set default values
    cboHPO.ListIndex = -1
    cboDMA.ListIndex = -1
    txtBudget.Text = ""
    
    ' Set focus to first field
    cboHPO.SetFocus
    
    Exit Sub
    
ErrorHandler:
    MsgBox "Error initializing form: " & Err.Description, vbCritical, "Form Error"
End Sub

' =============================================================================
' GENERATE BUTTON CLICK - Processes inputs and generates package
' =============================================================================
Private Sub cmdGenerate_Click()
    On Error GoTo ErrorHandler
    
    Dim selectedHPO As String
    Dim selectedDMA As String
    Dim budget As Double
    Dim result As Variant
    
    ' Validate inputs
    If cboHPO.ListIndex = -1 Then
        MsgBox "Please select an HPO.", vbExclamation, "Validation Error"
        cboHPO.SetFocus
        Exit Sub
    End If
    
    If cboDMA.ListIndex = -1 Then
        MsgBox "Please select a DMA.", vbExclamation, "Validation Error"
        cboDMA.SetFocus
        Exit Sub
    End If
    
    If Trim(txtBudget.Text) = "" Then
        MsgBox "Please enter a budget.", vbExclamation, "Validation Error"
        txtBudget.SetFocus
        Exit Sub
    End If
    
    If Not IsNumeric(txtBudget.Text) Then
        MsgBox "Budget must be a valid number.", vbExclamation, "Validation Error"
        txtBudget.SetFocus
        Exit Sub
    End If
    
    budget = CDbl(txtBudget.Text)
    
    If budget <= 0 Then
        MsgBox "Budget must be greater than zero.", vbExclamation, "Validation Error"
        txtBudget.SetFocus
        Exit Sub
    End If
    
    selectedHPO = cboHPO.Text
    selectedDMA = cboDMA.Text
    
    ' Show processing message
    Me.Enabled = False
    DoEvents
    
    ' Calculate package
    If CalculatePackage(selectedHPO, selectedDMA, budget, result) Then
        ' Generate output file (creates a filled copy, doesn't modify the Package Builder)
        GenerateOutputFile selectedHPO, selectedDMA, result
        
        ' Close form
        Unload Me
    Else
        Me.Enabled = True
    End If
    
    Exit Sub
    
ErrorHandler:
    Me.Enabled = True
    MsgBox "Error generating package: " & Err.Description, vbCritical, "Generation Error"
End Sub

' =============================================================================
' CANCEL BUTTON CLICK - Closes form without action
' =============================================================================
Private Sub cmdCancel_Click()
    Unload Me
End Sub

' =============================================================================
' BUDGET TEXT VALIDATION - Allows only numeric input
' =============================================================================
Private Sub txtBudget_KeyPress(ByVal KeyAscii As MSForms.ReturnInteger)
    ' Allow only digits, decimal point, and backspace
    Select Case KeyAscii
        Case 48 To 57  ' 0-9
            ' Allow
        Case 46  ' Decimal point
            ' Allow only one decimal point
            If InStr(txtBudget.Text, ".") > 0 Then
                KeyAscii = 0
            End If
        Case 8  ' Backspace
            ' Allow
        Case Else
            KeyAscii = 0
    End Select
End Sub

' =============================================================================
' HPO CHANGE - Shows info when HPO is selected
' =============================================================================
Private Sub cboHPO_Change()
    If cboHPO.ListIndex >= 0 Then
        Dim sport As String
        Dim liveCPM As Double
        Dim liveRange As String
        Dim supportRange As String
        
        sport = GetSport(cboHPO.Text)
        liveCPM = GetLiveCPM(cboHPO.Text)
        Call GetDates(cboHPO.Text, liveRange, supportRange)
        
        ' Update info label if it exists
        On Error Resume Next
        lblInfo.Caption = "Sport: " & sport & vbCrLf & _
                         "Live CPM: $" & Format(liveCPM, "0") & vbCrLf & _
                         "Live Dates: " & liveRange & vbCrLf & _
                         "Support Dates: " & supportRange
        On Error GoTo 0
    End If
End Sub

' =============================================================================
' FORM QUERYCLOSE - Handles form close button
' =============================================================================
Private Sub UserForm_QueryClose(Cancel As Integer, CloseMode As Integer)
    ' Allow closing via X button
    If CloseMode = 0 Then
        Cancel = False
    End If
End Sub
