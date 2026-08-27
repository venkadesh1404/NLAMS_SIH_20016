# ==============================================================================
# NLAMS (National Land Acquisition Management System) - Dataset Generator
# Generates comprehensive JSON, CSV, and SQL dataset files for SIH 20016
# ==============================================================================

param(
    [string]$OutputDir = "$PSScriptRoot",
    [int]$Seed = 42
)

Write-Host "Initializing NLAMS Dataset Generation..." -ForegroundColor Cyan

$JsonDir = Join-Path $OutputDir "json"
$CsvDir = Join-Path $OutputDir "csv"
$SqlDir = Join-Path $OutputDir "sql"

New-Item -ItemType Directory -Force -Path $JsonDir | Out-Null
New-Item -ItemType Directory -Force -Path $CsvDir | Out-Null
New-Item -ItemType Directory -Force -Path $SqlDir | Out-Null

# --- Master Lookup Tables ---
$States = @(
    @{ Code = "TN"; Name = "Tamil Nadu"; Lat = 11.1271; Lng = 78.6569; Districts = @("Chennai", "Tirunelveli", "Madurai", "Coimbatore", "Tiruchirappalli", "Salem", "Erode", "Vellore") },
    @{ Code = "KA"; Name = "Karnataka"; Lat = 15.3173; Lng = 75.7139; Districts = @("Bengaluru", "Mysuru", "Hubballi", "Belagavi", "Dakshina Kannada", "Tumakuru", "Kalaburagi") },
    @{ Code = "KL"; Name = "Kerala"; Lat = 10.8505; Lng = 76.2711; Districts = @("Thiruvananthapuram", "Kochi", "Kozhikode", "Thrissur", "Kollam", "Kannur", "Palakkad") },
    @{ Code = "MH"; Name = "Maharashtra"; Lat = 19.7515; Lng = 75.7139; Districts = @("Mumbai", "Pune", "Nagpur", "Nashik", "Aurangabad", "Solapur", "Thane", "Amravati") },
    @{ Code = "AP"; Name = "Andhra Pradesh"; Lat = 15.9129; Lng = 79.7400; Districts = @("Visakhapatnam", "Vijayawada", "Guntur", "Tirupati", "Kurnool", "Nellore", "Kakinada") },
    @{ Code = "TG"; Name = "Telangana"; Lat = 18.1124; Lng = 79.0193; Districts = @("Hyderabad", "Warangal", "Karimnagar", "Nizamabad", "Khammam", "Rangareddy", "Nalgonda") },
    @{ Code = "GJ"; Name = "Gujarat"; Lat = 22.2587; Lng = 71.1924; Districts = @("Ahmedabad", "Surat", "Vadodara", "Rajkot", "Gandhinagar", "Bhavnagar", "Jamnagar") },
    @{ Code = "RJ"; Name = "Rajasthan"; Lat = 27.0238; Lng = 74.2179; Districts = @("Jaipur", "Jodhpur", "Udaipur", "Kota", "Ajmer", "Bikaner", "Alwar", "Bharatpur") }
)

$ProjectTypes = @("Highways", "Railways", "Irrigation", "Industrial Corridor", "Urban Development", "Renewable Energy", "Public Infrastructure", "Other")
$Agencies = @("National Highways Authority of India (NHAI)", "PWD Tamil Nadu", "PWD Karnataka", "PWD Kerala", "PWD Maharashtra", "State Irrigation Dept", "Dedicated Freight Corridor Corp (DFCCIL)", "Metro Rail Corporation", "State Industrial Dev Corp (SIDC)")
$Stages = @("Proposal", "Scrutiny", "Approval", "Notification", "Award", "Compensation", "Possession", "R&R", "Completion")

$LandTypes = @("Wetland", "Dry Land", "Garden Land", "Poramboke", "Residential", "Commercial")
$OwnershipTypes = @("Private Patta", "Government", "Inam", "Temple Land", "Assigned", "Wakf")
$Villages = @("Melmaruvathur", "Keezhkattalai", "Therkku Poigainallur", "Vadakkukarai", "Thenkudi", "Keeladi", "Pazhaverkadu", "Kodiveri", "Alampatti", "Sulthanpet", "Devikapuram", "Nallur", "Kottur", "Manamadurai", "Kallidaikurichi")

$UserRoles = @(
    @{ Role = "central_ministry"; Title = "Central Ministry"; Dept = "Ministry of Road Transport & Highways" },
    @{ Role = "state_gov"; Title = "State Government"; Dept = "State Public Works Department" },
    @{ Role = "district_authority"; Title = "District Authority"; Dept = "District Collectorate & Revenue Division" },
    @{ Role = "pwd_agency"; Title = "PWD Agency"; Dept = "Infrastructure Projects Division" },
    @{ Role = "land_acquisition_officer"; Title = "Land Acquisition Officer (LAO)"; Dept = "Competent Land Acquisition Authority" },
    @{ Role = "rr_officer"; Title = "R&R Officer"; Dept = "Rehabilitation & Resettlement Cell" },
    @{ Role = "system_admin"; Title = "System Admin"; Dept = "NLAMS IT Infrastructure Cell" }
)

$Rand = [System.Random]::new($Seed)

function Get-RandomItem($array) {
    return $array[$Rand.Next(0, $array.Count)]
}

function Get-RandomFloat($min, $max, $decimals = 2) {
    $val = $min + ($Rand.NextDouble() * ($max - $min))
    return [Math]::Round($val, $decimals)
}

function Get-RiskPrediction($acqPct, $pendingParcels, $disputedParcels, $compPendingPct, $approvalDelay, $possessionDelay, $rrPendingPct) {
    $acqGap = [Math]::Max(0.0, 100.0 - [double]$acqPct)
    $parcelRisk = [Math]::Min(40.0, ([double]$pendingParcels * 0.5) + ([double]$disputedParcels * 1.5))
    $compRisk = [Math]::Min(25.0, [double]$compPendingPct * 0.5)
    $delayRisk = [Math]::Min(20.0, ([double]$approvalDelay * 0.3) + ([double]$possessionDelay * 0.2))
    $rrRisk = [Math]::Min(15.0, [double]$rrPendingPct * 0.3)
    $score = [Math]::Round([Math]::Min(100.0, $parcelRisk + $compRisk + $delayRisk + $rrRisk + ($acqGap * 0.1)))
    
    $level = if ($score -ge 80) { "CRITICAL" } elseif ($score -ge 60) { "HIGH" } elseif ($score -ge 35) { "MEDIUM" } else { "LOW" }
    
    $rec = switch ($level) {
        "CRITICAL" { "Immediate high-level escalation required. Expedite SLA clearances, fast-track compensation disbursements, and resolve legal disputes through special lok-adalat." }
        "HIGH" { "Prioritize compensation approval bottlenecks and district-level verification. Deploy additional land survey units." }
        "MEDIUM" { "Maintain proactive monitoring of pending revenue records and schedule timely joint possession surveys." }
        Default { "Project executing within optimal parameters. Proceed with standard milestone tracking." }
    }
    
    return @{
        Score = $score
        Level = $level
        Recommendation = $rec
        CompRisk = [Math]::Round($compRisk)
        DisputeRisk = [Math]::Round($disputedParcels * 1.5)
        PossessionRisk = [Math]::Round($possessionDelay * 0.2)
        RrRisk = [Math]::Round($rrRisk)
    }
}

# ==============================================================================
# 1. Users Generation
# ==============================================================================
Write-Host "Generating RBAC Users..." -ForegroundColor Gray
$Users = @(
    [ordered]@{ id = "U001"; name = "Arjun Mehta"; email = "central.mehta@nlams.gov.in"; role = "central_ministry"; department = "Ministry of Road Transport & Highways"; designation = "Joint Secretary (Land Admin)"; state = $null; district = $null; avatarColor = "#1e3a5f" },
    [ordered]@{ id = "U002"; name = "Sunita Rao"; email = "state.rao@nlams.gov.in"; role = "state_gov"; department = "PWD Tamil Nadu"; designation = "State Project Director"; state = "Tamil Nadu"; district = $null; avatarColor = "#2b6cb0" },
    [ordered]@{ id = "U003"; name = "Ramesh Iyer"; email = "district.iyer@nlams.gov.in"; role = "district_authority"; department = "District Collector Office"; designation = "District Collector & Magistrate"; state = "Tamil Nadu"; district = "Tirunelveli"; avatarColor = "#2c7a7b" },
    [ordered]@{ id = "U004"; name = "Kavya Krishnan"; email = "pwd.krishnan@nlams.gov.in"; role = "pwd_agency"; department = "Infrastructure Engineering Cell"; designation = "Superintending Engineer"; state = "Tamil Nadu"; district = "Tirunelveli"; avatarColor = "#2d3748" },
    [ordered]@{ id = "U005"; name = "Thomas Joseph"; email = "lao.joseph@nlams.gov.in"; role = "land_acquisition_officer"; department = "Revenue & Land Acquisition Authority"; designation = "Special Land Acquisition Officer (CALA)"; state = "Tamil Nadu"; district = "Tirunelveli"; avatarColor = "#744210" },
    [ordered]@{ id = "U006"; name = "Meera Nair"; email = "rr.nair@nlams.gov.in"; role = "rr_officer"; department = "Rehabilitation & Resettlement Division"; designation = "Director (R&R Operations)"; state = "Tamil Nadu"; district = "Tirunelveli"; avatarColor = "#22543d" },
    [ordered]@{ id = "U007"; name = "Vikram Singh"; email = "admin.singh@nlams.gov.in"; role = "system_admin"; department = "NLAMS IT Infrastructure Cell"; designation = "Lead Security & System Administrator"; state = $null; district = $null; avatarColor = "#4a5568" },
    [ordered]@{ id = "U008"; name = "Pooja Hegde"; email = "state.hegde@nlams.gov.in"; role = "state_gov"; department = "PWD Karnataka"; designation = "Chief Nodal Officer"; state = "Karnataka"; district = $null; avatarColor = "#2b6cb0" },
    [ordered]@{ id = "U009"; name = "Anand Patil"; email = "district.patil@nlams.gov.in"; role = "district_authority"; department = "District Collector Office"; designation = "District Magistrate"; state = "Maharashtra"; district = "Pune"; avatarColor = "#2c7a7b" },
    [ordered]@{ id = "U010"; name = "Suresh Varma"; email = "lao.varma@nlams.gov.in"; role = "land_acquisition_officer"; department = "CALA Unit AP"; designation = "Competent Authority Land Acquisition"; state = "Andhra Pradesh"; district = "Visakhapatnam"; avatarColor = "#744210" }
)

# ==============================================================================
# 2. Projects & Linked Sub-Entities Generation
# ==============================================================================
Write-Host "Generating Projects and Hierarchical Datasets..." -ForegroundColor Gray

$Projects = [System.Collections.Generic.List[PSCustomObject]]::new()
$LandParcels = [System.Collections.Generic.List[PSCustomObject]]::new()
$Notifications = [System.Collections.Generic.List[PSCustomObject]]::new()
$Awards = [System.Collections.Generic.List[PSCustomObject]]::new()
$CompensationRecords = [System.Collections.Generic.List[PSCustomObject]]::new()
$AffectedFamilies = [System.Collections.Generic.List[PSCustomObject]]::new()
$Milestones = [System.Collections.Generic.List[PSCustomObject]]::new()
$Alerts = [System.Collections.Generic.List[PSCustomObject]]::new()
$WorkflowTasks = [System.Collections.Generic.List[PSCustomObject]]::new()
$Documents = [System.Collections.Generic.List[PSCustomObject]]::new()
$AuditLogs = [System.Collections.Generic.List[PSCustomObject]]::new()
$SyncQueue = [System.Collections.Generic.List[PSCustomObject]]::new()
$MLTrainingData = [System.Collections.Generic.List[PSCustomObject]]::new()
$RiskPredictions = [System.Collections.Generic.List[PSCustomObject]]::new()

$ParcelCounter = 1
$NotifCounter = 1
$AwardCounter = 1
$CompCounter = 1
$FamCounter = 1
$MsCounter = 1
$AlertCounter = 1
$WfCounter = 1
$DocCounter = 1

# Base Demo Flagship Project
$DemoProj = [PSCustomObject]@{
    id = "PWD-TN-2026-001"
    name = "Chennai-Tirunelveli Infrastructure Corridor"
    agency = "PWD Tamil Nadu"
    state = "Tamil Nadu"
    district = "Tirunelveli"
    type = "Highways"
    landRequired = 842.0
    landAcquired = 524.0
    landNotified = 712.0
    acquisitionPct = 62.2
    compensationPct = 48.5
    possessionPct = 41.0
    rrPct = 35.0
    status = "Compensation Pending"
    stage = "Compensation"
    targetDate = "2027-03-15"
    estimatedCost = 12400.0
    risk = "HIGH"
    riskScore = 78
    lastUpdated = "2026-08-27 09:42"
    description = "6-lane access-controlled highway corridor connecting Chennai and Tirunelveli spanning 607 km, including service roads, flyovers, and toll plazas. Acquiring land across 4 districts with 142 affected parcels."
    parcels = @()
    affectedFamilies = 312
    displacedFamilies = 87
    compensationAssessed = 286.5
    compensationDisbursed = 142.0
}
$Projects.Add($DemoProj)

$ProjectTemplates = @(
    @{ Type = "Highways"; Suffixes = @("Expressway Expansion", "Economic Corridor Phase-II", "Ring Road Bypass", "Greenfield Highway") },
    @{ Type = "Railways"; Suffixes = @("High-Speed Rail Link", "Suburban Line Doubling", "Metro Rail Phase-3", "Freight Corridor Hub") },
    @{ Type = "Irrigation"; Suffixes = @("Canal Network Modernization", "Lift Irrigation Project", "Reservoir Expansion", "Barrage Command Area") },
    @{ Type = "Industrial Corridor"; Suffixes = @("Defense Industrial Park", "Mega Textile Park", "Smart Industrial City", "Electronic Hub") },
    @{ Type = "Urban Development"; Suffixes = @("Smart City Infrastructure", "Ring Water Supply Pipeline", "Administrative Township", "Outer Transit Link") },
    @{ Type = "Renewable Energy"; Suffixes = @("Ultra-Mega Solar Park", "Hybrid Wind-Solar Farm", "Pumped Storage Hydro Facility") },
    @{ Type = "Public Infrastructure"; Suffixes = @("AIIMS Campus & Medical Hub", "Integrated Multi-Modal Terminal", "University Transit Zone") }
)

$ProjIdCounter = 2

foreach ($stateObj in $States) {
    $numProjectsInState = $Rand.Next(3, 5)
    for ($i = 0; $i -lt $numProjectsInState; $i++) {
        $district = Get-RandomItem $stateObj.Districts
        $tmpl = Get-RandomItem $ProjectTemplates
        $projType = $tmpl.Type
        $suffix = Get-RandomItem $tmpl.Suffixes
        $projName = "$district $suffix"
        
        $landReq = [Math]::Round($Rand.Next(150, 1200) + $Rand.NextDouble(), 1)
        $acqPct = [Math]::Round($Rand.Next(10, 96) + $Rand.NextDouble(), 1)
        $landAcq = [Math]::Round(($landReq * $acqPct) / 100.0, 1)
        
        $notPct = [Math]::Min(100.0, [Math]::Round($acqPct + $Rand.Next(5, 25), 1))
        $landNot = [Math]::Round(($landReq * $notPct) / 100.0, 1)
        
        $compPct = [Math]::Round($Rand.Next(5, [Math]::Max(10, [int]$acqPct)), 1)
        $possPct = [Math]::Round($Rand.Next(5, [Math]::Max(8, [int]$compPct)), 1)
        $rrPct = [Math]::Round($Rand.Next(5, [Math]::Max(10, [int]$possPct)), 1)
        
        $stageIdx = [Math]::Min($Stages.Count - 1, [int][Math]::Floor(($acqPct + $compPct + $possPct) / 34.0))
        $stage = $Stages[$stageIdx]
        
        $statusOptions = switch ($stage) {
            "Proposal" { @("Submitted", "Under Scrutiny") }
            "Scrutiny" { @("Under Scrutiny", "Approved") }
            "Approval" { @("Approved", "Notification Issued") }
            "Notification" { @("Notification Issued", "Award Declared") }
            "Award" { @("Award Declared", "Compensation Pending") }
            "Compensation" { @("Compensation Pending", "Compensation Completed") }
            "Possession" { @("Possession Pending", "Possession Completed") }
            "R&R" { @("R&R In Progress", "Possession Completed") }
            "Completion" { @("Completed") }
            Default { @("Under Scrutiny") }
        }
        $status = Get-RandomItem $statusOptions
        if ($Rand.Next(0, 10) -gt 7 -and $stage -ne "Completion") { $status = "Delayed" }
        
        $pendingParcelsCount = $Rand.Next(2, 15)
        $disputedParcelsCount = $Rand.Next(0, 6)
        $compPendingPct = [Math]::Max(0.0, 100.0 - $compPct)
        $appDelay = if ($status -eq "Delayed") { $Rand.Next(25, 90) } else { $Rand.Next(0, 20) }
        $possDelay = if ($possPct -lt 50) { $Rand.Next(15, 60) } else { $Rand.Next(0, 15) }
        $rrPendingPct = [Math]::Max(0.0, 100.0 - $rrPct)
        
        $riskObj = Get-RiskPrediction $acqPct $pendingParcelsCount $disputedParcelsCount $compPendingPct $appDelay $possDelay $rrPendingPct
        
        $cost = [Math]::Round($Rand.Next(800, 25000) + $Rand.NextDouble() * 100, 2)
        $targetMonth = $Rand.Next(1, 13).ToString("D2")
        $targetDay = $Rand.Next(1, 29).ToString("D2")
        $targetYear = $Rand.Next(2026, 2029)
        
        $affFam = $Rand.Next(40, 500)
        $dispFam = [Math]::Round($affFam * ($Rand.Next(15, 45) / 100.0))
        $compAssessed = [Math]::Round($cost * ($Rand.Next(10, 25) / 100.0), 2)
        $compDisbursed = [Math]::Round(($compAssessed * $compPct) / 100.0, 2)
        
        $newProjId = "PWD-$($stateObj.Code)-2026-$($ProjIdCounter.ToString('D3'))"
        $ProjIdCounter++
        
        $projectItem = [PSCustomObject]@{
            id = $newProjId
            name = $projName
            agency = Get-RandomItem $Agencies
            state = $stateObj.Name
            district = $district
            type = $projType
            landRequired = $landReq
            landAcquired = $landAcq
            landNotified = $landNot
            acquisitionPct = $acqPct
            compensationPct = $compPct
            possessionPct = $possPct
            rrPct = $rrPct
            status = $status
            stage = $stage
            targetDate = "$targetYear-$targetMonth-$targetDay"
            estimatedCost = $cost
            risk = $riskObj.Level
            riskScore = $riskObj.Score
            lastUpdated = "2026-08-$($Rand.Next(15, 28).ToString('D2')) $($Rand.Next(8, 18).ToString('D2')):$($Rand.Next(10, 59).ToString('D2'))"
            description = "Strategic $projType project located in $district, $($stateObj.Name). Requires $landReq hectares across revenue sub-divisions for infrastructure modernization."
            parcels = @()
            affectedFamilies = $affFam
            displacedFamilies = $dispFam
            compensationAssessed = $compAssessed
            compensationDisbursed = $compDisbursed
        }
        
        $Projects.Add($projectItem)
    }
}

# ==============================================================================
# 3. Generate Child Entities For All Projects
# ==============================================================================
foreach ($proj in $Projects) {
    $stateName = $proj.state
    $stateInfo = $States | Where-Object { $_.Name -eq $stateName }
    $baseLat = if ($stateInfo) { $stateInfo.Lat } else { 20.0 }
    $baseLng = if ($stateInfo) { $stateInfo.Lng } else { 78.0 }
    
    # 3.1 Land Parcels
    $numParcels = if ($proj.id -eq "PWD-TN-2026-001") { 8 } else { $Rand.Next(4, 9) }
    $projParcelIds = @()
    
    for ($p = 1; $p -le $numParcels; $p++) {
        $parcelCode = "LP-$($ParcelCounter.ToString('D4'))-$($stateInfo.Code)"
        $ParcelCounter++
        $projParcelIds += $parcelCode
        
        $acqStatus = if ($proj.stage -in @("Compensation", "Possession", "R&R", "Completion")) {
            Get-RandomItem @("Acquired", "Acquired", "Notified", "Disputed")
        } elseif ($proj.stage -in @("Notification", "Award")) {
            Get-RandomItem @("Notified", "Notified", "Proposed", "Pending")
        } else {
            Get-RandomItem @("Proposed", "Pending")
        }
        
        $compStatus = switch ($acqStatus) {
            "Acquired" { Get-RandomItem @("Approved", "Partially Paid", "Fully Paid") }
            "Notified" { Get-RandomItem @("Not Started", "Assessed") }
            Default { "Not Started" }
        }
        
        $possStatus = switch ($acqStatus) {
            "Acquired" { Get-RandomItem @("Scheduled", "Taken", "Handover Completed") }
            Default { "Pending" }
        }
        
        $rrStatus = Get-RandomItem @("Not Started", "Eligible", "In Progress", "Completed", "Disputed")
        
        $parcelItem = [PSCustomObject]@{
            id = $parcelCode
            projectId = $proj.id
            surveyNumber = "$($Rand.Next(10, 890))/$($Rand.Next(1, 12))$([char]$Rand.Next(65, 68))"
            village = Get-RandomItem $Villages
            taluk = "$($proj.district) North"
            district = $proj.district
            state = $proj.state
            area = Get-RandomFloat 1.5 48.0 2
            landType = Get-RandomItem $LandTypes
            ownershipType = Get-RandomItem $OwnershipTypes
            lat = [Math]::Round($baseLat + (($Rand.NextDouble() - 0.5) * 1.8), 5)
            lng = [Math]::Round($baseLng + (($Rand.NextDouble() - 0.5) * 1.8), 5)
            acquisitionStatus = $acqStatus
            compensationStatus = $compStatus
            possessionStatus = $possStatus
            rrStatus = $rrStatus
            ownerCount = $Rand.Next(1, 8)
        }
        $LandParcels.Add($parcelItem)
    }
    $proj.parcels = $projParcelIds
    
    # 3.2 Gazette Notifications
    $notifTypes = @("Preliminary Notification", "Declaration", "Award Notification", "Possession Notice", "Other Statutory Notice")
    $numNotifs = $Rand.Next(1, 4)
    for ($n = 1; $n -le $numNotifs; $n++) {
        $notifId = "NOT-$($NotifCounter.ToString('D4'))"
        $NotifCounter++
        $nType = $notifTypes[$n - 1]
        $month = $Rand.Next(1, 8).ToString("D2")
        $day = $Rand.Next(1, 28).ToString("D2")
        $pubDay = ($Rand.Next(1, 28)).ToString("D2")
        
        $Notifications.Add([PSCustomObject]@{
            id = $notifId
            projectId = $proj.id
            projectName = $proj.name
            type = $nType
            number = "$($stateInfo.Code)-LA/2026/$($Rand.Next(100, 999))"
            issueDate = "2026-$month-$day"
            publicationDate = "2026-$month-$pubDay"
            status = Get-RandomItem @("Issued", "Published", "Published", "Draft")
            remarks = "Published in State Government Extraordinary Gazette and circulated in regional dailies as per Section 11/19 RFCTLARR 2013."
        })
    }
    
    # 3.3 Awards
    if ($proj.acquisitionPct -ge 20) {
        $numAwards = $Rand.Next(1, 3)
        for ($a = 1; $a -le $numAwards; $a++) {
            $awardId = "AWD-$($AwardCounter.ToString('D4'))"
            $AwardCounter++
            $awdMonth = $Rand.Next(2, 8).ToString("D2")
            
            $Awards.Add([PSCustomObject]@{
                id = $awardId
                projectId = $proj.id
                district = $proj.district
                village = Get-RandomItem $Villages
                surveyNumber = "$($Rand.Next(10, 500))/$($Rand.Next(1, 9))"
                awardDate = "2026-$awdMonth-$($Rand.Next(1, 28).ToString('D2'))"
                landArea = Get-RandomFloat 5.0 95.0 2
                awardAmount = [Math]::Round($Rand.Next(50, 950) + $Rand.NextDouble() * 50, 2)
                beneficiaryCount = $Rand.Next(4, 65)
                status = Get-RandomItem @("Draft", "Under Review", "Approved", "Declared")
            })
        }
    }
    
    # 3.4 Compensation Records
    if ($proj.compensationPct -ge 10) {
        $numComps = $Rand.Next(3, 8)
        for ($c = 1; $c -le $numComps; $c++) {
            $compId = "CMP-$($CompCounter.ToString('D5'))"
            $CompCounter++
            
            $assessed = [Math]::Round($Rand.Next(8, 180) + $Rand.NextDouble() * 10, 2)
            $approved = [Math]::Round($assessed * (Get-RandomFloat 0.8 1.0), 2)
            $paid = if ($proj.compensationPct -gt 50) { $approved } else { [Math]::Round($approved * (Get-RandomFloat 0.2 0.7), 2) }
            
            $compStat = if ($paid -ge $approved) { "Fully Paid" }
                        elseif ($paid -gt 0) { "Partially Paid" }
                        elseif ($approved -gt 0) { "Payment Pending" }
                        else { "Assessed" }
            
            $payDate = if ($paid -gt 0) { "2026-0$($Rand.Next(1, 8))-$($Rand.Next(1, 28).ToString('D2'))" } else { $null }
            
            $CompensationRecords.Add([PSCustomObject]@{
                id = $compId
                projectId = $proj.id
                projectName = $proj.name
                district = $proj.district
                beneficiaryId = "BEN-$($Rand.Next(10000, 99999))"
                landArea = Get-RandomFloat 0.5 18.0 2
                assessedAmount = $assessed
                approvedAmount = $approved
                paidAmount = $paid
                paymentDate = $payDate
                status = $compStat
            })
        }
    }
    
    # 3.5 Affected Families (R&R)
    $famCategories = @("Title Holder", "Occupant", "Tenant", "Agricultural Labour", "Artisan", "Other")
    $rrBenefits = @("Housing Plot", "Employment", "Financial Assistance", "Land Allotment", "Skill Training", "Multiple Benefits")
    $numFams = $Rand.Next(4, 10)
    for ($f = 1; $f -le $numFams; $f++) {
        $famId = "FAM-$($FamCounter.ToString('D5'))"
        $FamCounter++
        $isEligible = ($Rand.NextDouble() -gt 0.3)
        
        $AffectedFamilies.Add([PSCustomObject]@{
            id = $famId
            projectId = $proj.id
            district = $proj.district
            village = Get-RandomItem $Villages
            category = Get-RandomItem $famCategories
            landAffected = Get-RandomFloat 0.2 12.5 2
            displacementStatus = Get-RandomItem @("Not Displaced", "Partially Displaced", "Fully Displaced")
            compensationStatus = Get-RandomItem @("Not Started", "Assessed", "Approved", "Partially Paid", "Fully Paid")
            rrEligibility = $isEligible
            rrBenefit = if ($isEligible) { Get-RandomItem $rrBenefits } else { "None" }
            rrStatus = if ($isEligible) { Get-RandomItem @("Eligible", "In Progress", "Completed", "Disputed") } else { "Not Started" }
        })
    }
    
    # 3.6 Milestones
    $authorities = @("PWD Agency", "District Authority", "State Government", "Central Ministry", "Land Acquisition Officer", "R&R Officer")
    $currentStageIdx = $Stages.IndexOf($proj.stage)
    $projectMilestoneDelaySum = 0
    
    for ($m = 0; $m -lt $Stages.Count; $m++) {
        $msId = "MS-$($MsCounter.ToString('D5'))"
        $MsCounter++
        $stg = $Stages[$m]
        $plannedM = ($m + 1).ToString("D2")
        $plannedDate = "2026-$plannedM-$($Rand.Next(10, 28).ToString('D2'))"
        
        $mStatus = "Pending"
        $actDate = $null
        $delay = 0
        $rem = "Scheduled as per master DPR milestone plan."
        
        if ($m -lt $currentStageIdx) {
            $mStatus = "Completed"
            $actDate = "2026-$plannedM-$($Rand.Next(10, 28).ToString('D2'))"
            if ($Rand.NextDouble() -gt 0.6) {
                $delay = $Rand.Next(5, 45)
                $mStatus = "Delayed"
                $rem = "Delayed by $delay days due to inter-departmental joint verification."
                $projectMilestoneDelaySum += $delay
            }
        } elseif ($m -eq $currentStageIdx) {
            $mStatus = "In Progress"
            $rem = "Active statutory stage. Operations currently in progress."
        }
        
        $Milestones.Add([PSCustomObject]@{
            id = $msId
            projectId = $proj.id
            stage = $stg
            plannedDate = $plannedDate
            actualDate = $actDate
            authority = $authorities[[Math]::Min($m, $authorities.Count - 1)]
            status = $mStatus
            delayDays = $delay
            remarks = $rem
        })
    }
    
    # 3.7 Alerts
    if ($proj.risk -in @("HIGH", "CRITICAL") -or $Rand.NextDouble() -gt 0.4) {
        $alertTypes = @("Delayed Approval", "Pending Verification", "Compensation Delay", "Possession Delay", "R&R Delay", "Missing Document", "Expiring Deadline", "Long Pending Case")
        $numAlerts = if ($proj.risk -eq "CRITICAL") { $Rand.Next(2, 4) } else { $Rand.Next(1, 2) }
        
        for ($al = 1; $al -le $numAlerts; $al++) {
            $alertId = "ALT-$($AlertCounter.ToString('D4'))"
            $AlertCounter++
            $aType = Get-RandomItem $alertTypes
            $sev = if ($proj.risk -eq "CRITICAL") { "Critical" } elseif ($proj.risk -eq "HIGH") { Get-RandomItem @("High", "Critical") } else { Get-RandomItem @("Medium", "Low") }
            
            $Alerts.Add([PSCustomObject]@{
                id = $alertId
                type = $aType
                severity = $sev
                projectId = $proj.id
                projectName = $proj.name
                description = "Automated SLA Alert: $aType threshold exceeded for project $($proj.name). Critical bottleneck requires immediate escalation."
                createdDate = "2026-08-$($Rand.Next(20, 28).ToString('D2')) $($Rand.Next(8, 18).ToString('D2')):$($Rand.Next(10, 59).ToString('D2'))"
                escalationLevel = Get-RandomItem @("District", "State", "Central")
                status = Get-RandomItem @("Open", "Open", "Acknowledged", "Resolved")
            })
        }
    }
    
    # 3.8 Workflow Tasks
    if ($proj.stage -ne "Completion") {
        $wfId = "WF-$($WfCounter.ToString('D4'))"
        $WfCounter++
        $targetRole = Get-RandomItem @("district_authority", "state_gov", "land_acquisition_officer", "rr_officer")
        $roleName = ($UserRoles | Where-Object { $_.Role -eq $targetRole }).Title
        
        $WorkflowTasks.Add([PSCustomObject]@{
            id = $wfId
            projectId = $proj.id
            projectName = $proj.name
            currentStage = $proj.stage
            assignedTo = $roleName
            assignedRole = $targetRole
            status = Get-RandomItem @("Pending", "Pending", "Forwarded", "Approved")
            createdDate = "2026-08-$($Rand.Next(18, 27).ToString('D2'))"
            description = "Action required: Review statutory compliance, verify land survey files, and authorize stage progression for $($proj.stage)."
            priority = if ($proj.risk -in @("CRITICAL", "HIGH")) { "High" } else { "Medium" }
        })
    }
    
    # 3.9 Documents
    $docCategories = @("Project Proposal", "DPR", "Land Records", "Survey Documents", "Notifications", "Awards", "Compensation Documents", "Possession Records", "R&R Documents", "Government Orders")
    $numDocs = $Rand.Next(3, 6)
    for ($d = 1; $d -le $numDocs; $d++) {
        $docId = "DOC-$($DocCounter.ToString('D5'))"
        $DocCounter++
        $cat = Get-RandomItem $docCategories
        $cleanCat = $cat -replace '\s', '_'
        
        $Documents.Add([PSCustomObject]@{
            id = $docId
            projectId = $proj.id
            projectName = $proj.name
            category = $cat
            fileName = "$($cleanCat)_$($proj.id).pdf"
            uploadedBy = Get-RandomItem @("Field Officer Kavya", "District Officer Ramesh", "LAO Unit", "PWD Engineering Team")
            uploadDate = "2026-0$($Rand.Next(1, 8))-$($Rand.Next(1, 28).ToString('D2'))"
            version = "v$($Rand.Next(1, 3)).$($Rand.Next(0, 9))"
            status = Get-RandomItem @("Verified", "Verified", "Pending", "Rejected")
            size = "$($Rand.Next(350, 7800)) KB"
        })
    }
    
    # 3.10 ML Training Feature Row
    $pendingP = ($LandParcels | Where-Object { $_.projectId -eq $proj.id -and $_.acquisitionStatus -in @("Proposed", "Pending") }).Count
    $disputedP = ($LandParcels | Where-Object { $_.projectId -eq $proj.id -and $_.acquisitionStatus -eq "Disputed" }).Count
    $compPendPct = [Math]::Max(0.0, 100.0 - $proj.compensationPct)
    $appDelayDays = $projectMilestoneDelaySum
    $possDelayDays = if ($proj.possessionPct -lt 50) { $Rand.Next(10, 45) } else { 0 }
    $rrPendPct = [Math]::Max(0.0, 100.0 - $proj.rrPct)
    
    $pred = Get-RiskPrediction $proj.acquisitionPct $pendingP $disputedP $compPendPct $appDelayDays $possDelayDays $rrPendPct
    
    $MLTrainingData.Add([PSCustomObject]@{
        projectId = $proj.id
        projectName = $proj.name
        state = $proj.state
        projectType = $proj.type
        landRequired = $proj.landRequired
        landAcquired = $proj.landAcquired
        land_acquisition_percentage = $proj.acquisitionPct
        pending_parcels = $pendingP
        disputed_parcels = $disputedP
        compensation_pending_percentage = $compPendPct
        approval_delay_days = $appDelayDays
        possession_delay_days = $possDelayDays
        rr_pending_percentage = $rrPendPct
        risk_score = $pred.Score
        risk_level = $pred.Level
        recommendation = $pred.Recommendation
    })
    
    $RiskPredictions.Add([PSCustomObject]@{
        projectId = $proj.id
        projectName = $proj.name
        riskScore = $pred.Score
        riskLevel = $pred.Level
        recommendation = $pred.Recommendation
        factors = @(
            @{ name = "Compensation Pending"; value = "$compPendPct%"; weight = $pred.CompRisk },
            @{ name = "Land Disputes"; value = "$disputedP"; weight = $pred.DisputeRisk },
            @{ name = "Possession Delay"; value = "$possDelayDays days"; weight = $pred.PossessionRisk },
            @{ name = "R&R Pending"; value = "$rrPendPct%"; weight = $pred.RrRisk }
        )
    })
}

# ==============================================================================
# 4. Audit Trail & Sync Queue Generation
# ==============================================================================
Write-Host "Generating Audit Logs and Sync Queue Records..." -ForegroundColor Gray

$AuditUsers = @("District Officer Ramesh", "State Officer Sunita", "Central Officer Arjun", "Field Officer Kavya", "LAO Thomas", "R&R Officer Meera")
$AuditModules = @("Projects", "Compensation", "Land Verification", "Notifications", "Awards", "Possession", "R&R", "Workflow", "Documents")
$AuditActions = @("CREATE", "UPDATE", "APPROVE", "REJECT", "FORWARD", "LOGIN", "LOGOUT")

for ($i = 1; $i -le 100; $i++) {
    $isOffline = ($Rand.NextDouble() -gt 0.75)
    $tHour = $Rand.Next(9, 19).ToString("D2")
    $tMin = $Rand.Next(0, 59).ToString("D2")
    $tDay = $Rand.Next(20, 28).ToString("D2")
    
    $AuditLogs.Add([PSCustomObject]@{
        id = "AUD-$($i.ToString('D5'))"
        timestamp = "$tDay-Aug-2026 $tHour`:$tMin"
        user = Get-RandomItem $AuditUsers
        role = Get-RandomItem $UserRoles.Title
        module = Get-RandomItem $AuditModules
        action = Get-RandomItem $AuditActions
        recordId = if ($Rand.NextDouble() -gt 0.5) { (Get-RandomItem $Projects).id } else { (Get-RandomItem $LandParcels).id }
        description = "Authorized administrative transaction executed on state portal."
        origin = if ($isOffline) { "OFFLINE" } else { "ONLINE" }
        syncTimestamp = if ($isOffline) { "$tDay-Aug-2026 $($Rand.Next(19, 23).ToString('D2'))`:$tMin" } else { $null }
    })
}

for ($s = 1; $s -le 25; $s++) {
    $sStatus = Get-RandomItem @("Pending", "Pending", "Synchronizing", "Synchronized", "Failed", "Conflict")
    $SyncQueue.Add([PSCustomObject]@{
        id = "SYN-$($s.ToString('D4'))"
        module = Get-RandomItem @("Land Verification", "Compensation", "Possession", "Field Inspection")
        recordId = (Get-RandomItem $LandParcels).id
        action = Get-RandomItem @("CREATE", "UPDATE")
        createdTime = "2026-08-$($Rand.Next(25, 28).ToString('D2')) $($Rand.Next(8, 17).ToString('D2')):$($Rand.Next(0, 59).ToString('D2'))"
        retryCount = $Rand.Next(0, 4)
        status = $sStatus
        lastError = if ($sStatus -eq "Failed") { "Network timeout during cryptographic handshake." } elseif ($sStatus -eq "Conflict") { "Remote record modified by district coordinator." } else { $null }
    })
}

# ==============================================================================
# 5. Write JSON Files
# ==============================================================================
Write-Host "Writing JSON Datasets to $JsonDir..." -ForegroundColor Green

$DatasetsMap = @{
    "projects.json" = $Projects
    "land_parcels.json" = $LandParcels
    "notifications.json" = $Notifications
    "awards.json" = $Awards
    "compensation_records.json" = $CompensationRecords
    "affected_families.json" = $AffectedFamilies
    "milestones.json" = $Milestones
    "alerts.json" = $Alerts
    "workflow_tasks.json" = $WorkflowTasks
    "documents.json" = $Documents
    "audit_logs.json" = $AuditLogs
    "sync_queue.json" = $SyncQueue
    "users.json" = $Users
    "risk_predictions.json" = $RiskPredictions
}

foreach ($fileName in $DatasetsMap.Keys) {
    $filePath = Join-Path $JsonDir $fileName
    $jsonContent = $DatasetsMap[$fileName] | ConvertTo-Json -Depth 10
    [System.IO.File]::WriteAllText($filePath, $jsonContent, [System.Text.Encoding]::UTF8)
}

# ==============================================================================
# 6. Write CSV Files
# ==============================================================================
Write-Host "Writing CSV Datasets to $CsvDir..." -ForegroundColor Green

function Export-CleanCsv($dataArray, $filePath) {
    $dataArray | Export-Csv -Path $filePath -NoTypeInformation -Encoding UTF8
}

Export-CleanCsv ($Projects | Select-Object id, name, agency, state, district, type, landRequired, landAcquired, landNotified, acquisitionPct, compensationPct, possessionPct, rrPct, status, stage, targetDate, estimatedCost, risk, riskScore, affectedFamilies, displacedFamilies, compensationAssessed, compensationDisbursed, lastUpdated) (Join-Path $CsvDir "projects.csv")
Export-CleanCsv $LandParcels (Join-Path $CsvDir "land_parcels.csv")
Export-CleanCsv $Notifications (Join-Path $CsvDir "notifications.csv")
Export-CleanCsv $Awards (Join-Path $CsvDir "awards.csv")
Export-CleanCsv $CompensationRecords (Join-Path $CsvDir "compensation_records.csv")
Export-CleanCsv $AffectedFamilies (Join-Path $CsvDir "affected_families.csv")
Export-CleanCsv $Milestones (Join-Path $CsvDir "milestones.csv")
Export-CleanCsv $Alerts (Join-Path $CsvDir "alerts.csv")
Export-CleanCsv $WorkflowTasks (Join-Path $CsvDir "workflow_tasks.csv")
Export-CleanCsv $Documents (Join-Path $CsvDir "documents.csv")
Export-CleanCsv $AuditLogs (Join-Path $CsvDir "audit_logs.csv")
Export-CleanCsv $SyncQueue (Join-Path $CsvDir "sync_queue.csv")
Export-CleanCsv $Users (Join-Path $CsvDir "users.csv")
Export-CleanCsv $MLTrainingData (Join-Path $CsvDir "ml_risk_training_data.csv")

# ==============================================================================
# 7. Write Relational SQL DDL & Seed Statements
# ==============================================================================
Write-Host "Writing SQL Schema & Seed Data to $SqlDir..." -ForegroundColor Green

$SchemaSql = @"
-- =============================================================================
-- NLAMS (National Land Acquisition Management System) - Relational Schema DDL
-- Supported engines: PostgreSQL, MySQL 8+, SQLite 3
-- =============================================================================

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(32) PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    email VARCHAR(128) UNIQUE NOT NULL,
    role VARCHAR(64) NOT NULL,
    department VARCHAR(128) NOT NULL,
    designation VARCHAR(128) NOT NULL,
    state VARCHAR(64),
    district VARCHAR(64),
    avatar_color VARCHAR(16) DEFAULT '#1e3a5f',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS projects (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    agency VARCHAR(128) NOT NULL,
    state VARCHAR(64) NOT NULL,
    district VARCHAR(64) NOT NULL,
    type VARCHAR(64) NOT NULL,
    land_required NUMERIC(12, 2) NOT NULL DEFAULT 0.0,
    land_acquired NUMERIC(12, 2) NOT NULL DEFAULT 0.0,
    land_notified NUMERIC(12, 2) NOT NULL DEFAULT 0.0,
    acquisition_pct NUMERIC(5, 2) NOT NULL DEFAULT 0.0,
    compensation_pct NUMERIC(5, 2) NOT NULL DEFAULT 0.0,
    possession_pct NUMERIC(5, 2) NOT NULL DEFAULT 0.0,
    rr_pct NUMERIC(5, 2) NOT NULL DEFAULT 0.0,
    status VARCHAR(64) NOT NULL,
    stage VARCHAR(64) NOT NULL,
    target_date DATE NOT NULL,
    estimated_cost NUMERIC(14, 2) NOT NULL DEFAULT 0.0,
    risk VARCHAR(16) NOT NULL DEFAULT 'LOW',
    risk_score INTEGER NOT NULL DEFAULT 0,
    affected_families INTEGER NOT NULL DEFAULT 0,
    displaced_families INTEGER NOT NULL DEFAULT 0,
    compensation_assessed NUMERIC(14, 2) NOT NULL DEFAULT 0.0,
    compensation_disbursed NUMERIC(14, 2) NOT NULL DEFAULT 0.0,
    description TEXT,
    last_updated VARCHAR(32)
);

CREATE TABLE IF NOT EXISTS land_parcels (
    id VARCHAR(64) PRIMARY KEY,
    project_id VARCHAR(64) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    survey_number VARCHAR(64) NOT NULL,
    village VARCHAR(128) NOT NULL,
    taluk VARCHAR(128) NOT NULL,
    district VARCHAR(64) NOT NULL,
    state VARCHAR(64) NOT NULL,
    area NUMERIC(10, 2) NOT NULL,
    land_type VARCHAR(64) NOT NULL,
    ownership_type VARCHAR(64) NOT NULL,
    lat NUMERIC(10, 6),
    lng NUMERIC(10, 6),
    acquisition_status VARCHAR(64) NOT NULL,
    compensation_status VARCHAR(64) NOT NULL,
    possession_status VARCHAR(64) NOT NULL,
    rr_status VARCHAR(64) NOT NULL,
    owner_count INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(64) PRIMARY KEY,
    project_id VARCHAR(64) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    project_name VARCHAR(255) NOT NULL,
    type VARCHAR(128) NOT NULL,
    number VARCHAR(128) NOT NULL,
    issue_date DATE NOT NULL,
    publication_date DATE NOT NULL,
    status VARCHAR(64) NOT NULL,
    remarks TEXT
);

CREATE TABLE IF NOT EXISTS awards (
    id VARCHAR(64) PRIMARY KEY,
    project_id VARCHAR(64) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    district VARCHAR(64) NOT NULL,
    village VARCHAR(128) NOT NULL,
    survey_number VARCHAR(64) NOT NULL,
    award_date DATE NOT NULL,
    land_area NUMERIC(10, 2) NOT NULL,
    award_amount NUMERIC(14, 2) NOT NULL,
    beneficiary_count INTEGER NOT NULL DEFAULT 1,
    status VARCHAR(64) NOT NULL
);

CREATE TABLE IF NOT EXISTS compensation_records (
    id VARCHAR(64) PRIMARY KEY,
    project_id VARCHAR(64) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    project_name VARCHAR(255) NOT NULL,
    district VARCHAR(64) NOT NULL,
    beneficiary_id VARCHAR(64) NOT NULL,
    land_area NUMERIC(10, 2) NOT NULL,
    assessed_amount NUMERIC(14, 2) NOT NULL,
    approved_amount NUMERIC(14, 2) NOT NULL,
    paid_amount NUMERIC(14, 2) NOT NULL,
    payment_date DATE,
    status VARCHAR(64) NOT NULL
);

CREATE TABLE IF NOT EXISTS affected_families (
    id VARCHAR(64) PRIMARY KEY,
    project_id VARCHAR(64) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    district VARCHAR(64) NOT NULL,
    village VARCHAR(128) NOT NULL,
    category VARCHAR(64) NOT NULL,
    land_affected NUMERIC(10, 2) NOT NULL,
    displacement_status VARCHAR(64) NOT NULL,
    compensation_status VARCHAR(64) NOT NULL,
    rr_eligibility BOOLEAN NOT NULL DEFAULT TRUE,
    rr_benefit VARCHAR(128),
    rr_status VARCHAR(64) NOT NULL
);

CREATE TABLE IF NOT EXISTS milestones (
    id VARCHAR(64) PRIMARY KEY,
    project_id VARCHAR(64) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    stage VARCHAR(64) NOT NULL,
    planned_date DATE NOT NULL,
    actual_date DATE,
    authority VARCHAR(128) NOT NULL,
    status VARCHAR(64) NOT NULL,
    delay_days INTEGER DEFAULT 0,
    remarks TEXT
);

CREATE TABLE IF NOT EXISTS alerts (
    id VARCHAR(64) PRIMARY KEY,
    project_id VARCHAR(64) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    project_name VARCHAR(255) NOT NULL,
    type VARCHAR(128) NOT NULL,
    severity VARCHAR(32) NOT NULL,
    description TEXT NOT NULL,
    created_date VARCHAR(32) NOT NULL,
    escalation_level VARCHAR(32) NOT NULL,
    status VARCHAR(32) NOT NULL
);

CREATE TABLE IF NOT EXISTS workflow_tasks (
    id VARCHAR(64) PRIMARY KEY,
    project_id VARCHAR(64) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    project_name VARCHAR(255) NOT NULL,
    current_stage VARCHAR(64) NOT NULL,
    assigned_to VARCHAR(128) NOT NULL,
    assigned_role VARCHAR(64) NOT NULL,
    status VARCHAR(32) NOT NULL,
    created_date DATE NOT NULL,
    description TEXT NOT NULL,
    priority VARCHAR(32) NOT NULL
);

CREATE TABLE IF NOT EXISTS documents (
    id VARCHAR(64) PRIMARY KEY,
    project_id VARCHAR(64) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    project_name VARCHAR(255) NOT NULL,
    category VARCHAR(128) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    uploaded_by VARCHAR(128) NOT NULL,
    upload_date DATE NOT NULL,
    version VARCHAR(16) NOT NULL,
    status VARCHAR(32) NOT NULL,
    file_size VARCHAR(32) NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(64) PRIMARY KEY,
    timestamp VARCHAR(32) NOT NULL,
    username VARCHAR(128) NOT NULL,
    role VARCHAR(128) NOT NULL,
    module VARCHAR(64) NOT NULL,
    action VARCHAR(32) NOT NULL,
    record_id VARCHAR(64) NOT NULL,
    description TEXT NOT NULL,
    origin VARCHAR(16) NOT NULL,
    sync_timestamp VARCHAR(32)
);

CREATE INDEX IF NOT EXISTS idx_parcels_project ON land_parcels(project_id);
CREATE INDEX IF NOT EXISTS idx_comp_project ON compensation_records(project_id);
CREATE INDEX IF NOT EXISTS idx_milestones_project ON milestones(project_id);
CREATE INDEX IF NOT EXISTS idx_alerts_project ON alerts(project_id);
"@

[System.IO.File]::WriteAllText((Join-Path $SqlDir "nlams_schema.sql"), $SchemaSql, [System.Text.Encoding]::UTF8)

# Generate Seed SQL
$SeedLines = [System.Collections.Generic.List[string]]::new()
$SeedLines.Add("-- NLAMS Automated Data Seed Script")
$SeedLines.Add("BEGIN TRANSACTION;")

foreach ($u in $Users) {
    $st = if ($u.state) { "'$($u.state)'" } else { "NULL" }
    $dt = if ($u.district) { "'$($u.district)'" } else { "NULL" }
    $SeedLines.Add("INSERT INTO users (id, name, email, role, department, designation, state, district, avatar_color) VALUES ('$($u.id)', '$($u.name)', '$($u.email)', '$($u.role)', '$($u.department)', '$($u.designation)', $st, $dt, '$($u.avatarColor)');")
}

foreach ($p in $Projects) {
    $descEsc = $p.description -replace "'", "''"
    $nameEsc = $p.name -replace "'", "''"
    $agencyEsc = $p.agency -replace "'", "''"
    $SeedLines.Add("INSERT INTO projects (id, name, agency, state, district, type, land_required, land_acquired, land_notified, acquisition_pct, compensation_pct, possession_pct, rr_pct, status, stage, target_date, estimated_cost, risk, risk_score, affected_families, displaced_families, compensation_assessed, compensation_disbursed, description, last_updated) VALUES ('$($p.id)', '$nameEsc', '$agencyEsc', '$($p.state)', '$($p.district)', '$($p.type)', $($p.landRequired), $($p.landAcquired), $($p.landNotified), $($p.acquisitionPct), $($p.compensationPct), $($p.possessionPct), $($p.rrPct), '$($p.status)', '$($p.stage)', '$($p.targetDate)', $($p.estimatedCost), '$($p.risk)', $($p.riskScore), $($p.affectedFamilies), $($p.displacedFamilies), $($p.compensationAssessed), $($p.compensationDisbursed), '$descEsc', '$($p.lastUpdated)');")
}

foreach ($lp in $LandParcels) {
    $SeedLines.Add("INSERT INTO land_parcels (id, project_id, survey_number, village, taluk, district, state, area, land_type, ownership_type, lat, lng, acquisition_status, compensation_status, possession_status, rr_status, owner_count) VALUES ('$($lp.id)', '$($lp.projectId)', '$($lp.surveyNumber)', '$($lp.village)', '$($lp.taluk)', '$($lp.district)', '$($lp.state)', $($lp.area), '$($lp.landType)', '$($lp.ownershipType)', $($lp.lat), $($lp.lng), '$($lp.acquisitionStatus)', '$($lp.compensationStatus)', '$($lp.possessionStatus)', '$($lp.rrStatus)', $($lp.ownerCount));")
}

$SeedLines.Add("COMMIT;")
[System.IO.File]::WriteAllLines((Join-Path $SqlDir "nlams_seed_data.sql"), $SeedLines, [System.Text.Encoding]::UTF8)

# ==============================================================================
# Summary
# ==============================================================================
Write-Host "============================================================" -ForegroundColor Green
Write-Host " NLAMS Dataset Generation Finished Successfully!" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
Write-Host "Projects:             $($Projects.Count)" -ForegroundColor Yellow
Write-Host "Land Parcels:         $($LandParcels.Count)" -ForegroundColor Yellow
Write-Host "Notifications:        $($Notifications.Count)" -ForegroundColor Yellow
Write-Host "Awards:               $($Awards.Count)" -ForegroundColor Yellow
Write-Host "Compensation Records: $($CompensationRecords.Count)" -ForegroundColor Yellow
Write-Host "Affected Families:    $($AffectedFamilies.Count)" -ForegroundColor Yellow
Write-Host "Milestones:           $($Milestones.Count)" -ForegroundColor Yellow
Write-Host "Alerts:               $($Alerts.Count)" -ForegroundColor Yellow
Write-Host "Workflow Tasks:       $($WorkflowTasks.Count)" -ForegroundColor Yellow
Write-Host "Documents:            $($Documents.Count)" -ForegroundColor Yellow
Write-Host "Audit Logs:           $($AuditLogs.Count)" -ForegroundColor Yellow
Write-Host "Sync Queue Items:     $($SyncQueue.Count)" -ForegroundColor Yellow
Write-Host "Users:                $($Users.Count)" -ForegroundColor Yellow
Write-Host "ML Training Samples:  $($MLTrainingData.Count)" -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Green
