# HPO Stream Package Builder - VBA Setup Guide

This document provides step-by-step instructions for setting up the HPO Package Builder macro in Microsoft 365 PowerPoint.

## Overview

The HPO Package Builder automatically generates advertising packages by:
1. Prompting for HPO selection (from HPOs.xlsx)
2. Prompting for DMA selection (from DMAs.xlsx)  
3. Prompting for budget entry
4. Calculating Live impressions (50% of budget at HPO's Live CPM)
5. Validating against Max Live Impressions limit
6. Calculating Support impressions (remaining 50% split across 3 packages)
7. Filling in all placeholder values in the template
8. Saving the completed package to an Output folder

## File Structure Required

```
HPO Package Builder/
├── HPO Stream Package Builder.pptm  (macro-enabled presentation)
├── Assets/
│   ├── HPOs.xlsx
│   ├── DMAs.xlsx
│   ├── Live CPM.xlsx
│   ├── Max Live Imps.xlsx
│   ├── Dates.xlsx
│   └── Templates/
│       ├── College Football - 2026-2027.pptx
│       ├── Men's March Madness 2026.pptx
│       └── ... (other HPO templates)
└── Output/  (created automatically)
```

## Setup Instructions

### Step 1: Prepare the Macro-Enabled File

1. Open `HPO Stream Package Builder.pptx` in PowerPoint
2. Go to **File > Save As**
3. Change "Save as type" to **PowerPoint Macro-Enabled Presentation (*.pptm)**
4. Save as `HPO Stream Package Builder.pptm`

### Step 2: Open VBA Editor

1. Press **Alt + F11** to open the Visual Basic for Applications (VBA) Editor
2. If you see a "Microsoft Visual Basic for Applications" window, you're in the right place

### Step 3: Add Module 1 (Main Logic)

1. In the VBA Editor, go to **Insert > Module**
2. In the Properties window (lower left), rename it to `Module_HPOPackageBuilder`
3. Copy and paste the entire contents of `Module_HPOPackageBuilder.bas` into this module

### Step 4: Add Module 2 (Presentation Update)

1. Go to **Insert > Module** again
2. Rename it to `Module_PresentationUpdate`
3. Copy and paste the entire contents of `Module_PresentationUpdate.bas` into this module

### Step 5: Create the UserForm

1. Go to **Insert > UserForm**
2. In the Properties window, set these properties:
   - **(Name)**: `frmPackageBuilder`
   - **Caption**: `HPO Stream Package Builder`
   - **Height**: `300`
   - **Width**: `400`

### Step 6: Add Controls to UserForm

Add these controls from the Toolbox (View > Toolbox if not visible):

#### Labels:
| Control | Name | Caption | Top | Left |
|---------|------|---------|-----|------|
| Label | lblHPO | Select HPO: | 20 | 20 |
| Label | lblDMA | Select DMA: | 60 | 20 |
| Label | lblBudget | Enter Budget ($): | 100 | 20 |
| Label | lblInfo | (leave blank) | 150 | 20 |

#### ComboBoxes:
| Control | Name | Top | Left | Width | Height |
|---------|------|-----|------|-------|--------|
| ComboBox | cboHPO | 20 | 120 | 250 | 20 |
| ComboBox | cboDMA | 60 | 120 | 250 | 20 |

#### TextBox:
| Control | Name | Top | Left | Width |
|---------|------|-----|------|-------|
| TextBox | txtBudget | 100 | 120 | 150 |

#### Buttons:
| Control | Name | Caption | Top | Left | Width |
|---------|------|---------|-----|------|-------|
| CommandButton | cmdGenerate | Generate Package | 230 | 120 | 120 |
| CommandButton | cmdCancel | Cancel | 230 | 250 | 80 |

### Step 7: Add UserForm Code

1. Double-click on the UserForm to open its code window
2. Delete any existing code
3. Copy and paste the entire contents of `frmPackageBuilder.frm`

### Step 8: Enable Macros on Open

The `Auto_Open()` subroutine in Module_HPOPackageBuilder will automatically show the form when the presentation opens. Make sure:

1. Go to **File > Options > Trust Center > Trust Center Settings**
2. Under **Macro Settings**, select "Enable all macros" or "Disable all macros with notification"
3. Save and close the presentation
4. When you reopen it, click "Enable Content" if prompted

### Step 9: Save and Test

1. Press **Ctrl + S** to save
2. Close the VBA Editor
3. Close PowerPoint completely
4. Reopen `HPO Stream Package Builder.pptm`
5. The form should appear automatically

## Troubleshooting

### Form doesn't appear on open
- Ensure the file is saved as `.pptm` (macro-enabled)
- Check that macros are enabled in Trust Center settings
- Try running the macro manually: **View > Macros > ShowPackageBuilder > Run**

### "Data Load Error" message
- Verify all Excel files exist in the Assets folder
- Check file names match exactly (case-sensitive):
  - `HPOs.xlsx`
  - `DMAs.xlsx`
  - `Live CPM.xlsx`
  - `Max Live Imps.xlsx`
  - `Dates.xlsx`

### "Budget is too large" error
- The calculated Live Impressions exceed the maximum allowed for that DMA/HPO combination
- Try a smaller budget or different DMA

### Compile Error
- Make sure you copied all the code correctly
- Ensure no partial lines were cut off
- Check that you renamed the modules and form correctly

## CPM Rates

| Package Type | CPM |
|--------------|-----|
| Addressable Targeting | $40 |
| Custom Networks Targeting | $35 |
| Audience Targeting | $29 |

Live CPM varies by HPO and is loaded from `Live CPM.xlsx`.

## Calculation Logic

1. **Live Budget** = 50% of total budget
2. **Support Budget** = 50% of total budget
3. **Live Impressions** = (Live Budget / Live CPM) × 1000
4. **Per-Package Support Budget** = Support Budget / 3
5. **Addressable Imps** = (Support Budget/3 / $40) × 1000
6. **Custom Nets Imps** = (Support Budget/3 / $35) × 1000
7. **Audience Imps** = (Support Budget/3 / $29) × 1000
8. **Package Total Imps** = Live Imps + Support Imps (per option)
9. **Package Total Investment** = Live Budget + Support Budget/3
10. **Package eCPM** = (Total Investment / Total Imps) × 1000

## Output

Generated packages are saved to:
```
HPO Package Builder/Output/{DMA}_{HPO}_Package.pptx
```

For example: `Output/New_York_NFL_-_2026-2027_Package.pptx`
