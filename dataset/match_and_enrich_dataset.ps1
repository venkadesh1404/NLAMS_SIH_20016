# ==============================================================================
# NLAMS - Dataset Matcher & Schema Alignment Script
# Transforms user raw CSV (50 records) into 100% compliant NLAMS Schema
# ==============================================================================

param(
    [string]$InputCsv = "$PSScriptRoot\raw_user_input.csv",
    [string]$OutputDir = "$PSScriptRoot",
    [int]$Seed = 42
)

Write-Host "Matching and Enriching Dataset against NLAMS Schema..." -ForegroundColor Cyan

$JsonDir = Join-Path $OutputDir "json"
$CsvDir = Join-Path $OutputDir "csv"
$SqlDir = Join-Path $OutputDir "sql"

New-Item -ItemType Directory -Force -Path $JsonDir | Out-Null
New-Item -ItemType Directory -Force -Path $CsvDir | Out-Null
New-Item -ItemType Directory -Force -Path $SqlDir | Out-Null

$RawRows = Import-Csv -Path $InputCsv
Write-Host "Read $($RawRows.Count) raw records from $InputCsv" -ForegroundColor Gray

# Geographic Lookup
$GeoLookup = @{
    "Mumbai" = @{ State = "Maharashtra"; Lat = 19.0760; Lng = 72.8777; Taluk = "Mumbai Suburban" }
    "Pune" = @{ State = "Maharashtra"; Lat = 18.5204; Lng = 73.8567; Taluk = "Haveli" }
    "Nagpur" = @{ State = "Maharashtra"; Lat = 21.1458; Lng = 79.0882; Taluk = "Nagpur Urban" }
    "Nashik" = @{ State = "Maharashtra"; Lat = 19.9975; Lng = 73.7898; Taluk = "Nashik" }
    "Aurangabad" = @{ State = "Maharashtra"; Lat = 19.8762; Lng = 75.3433; Taluk = "Aurangabad" }
    
    "Chennai" = @{ State = "Tamil Nadu"; Lat = 13.0827; Lng = 80.2707; Taluk = "Guindy" }
    "Coimbatore" = @{ State = "Tamil Nadu"; Lat = 11.0168; Lng = 76.9558; Taluk = "Coimbatore North" }
    "Madurai" = @{ State = "Tamil Nadu"; Lat = 9.9252; Lng = 78.1198; Taluk = "Madurai South" }
    "Tirunelveli" = @{ State = "Tamil Nadu"; Lat = 8.7139; Lng = 77.7567; Taluk = "Palayamkottai" }
    "Tiruchirappalli" = @{ State = "Tamil Nadu"; Lat = 10.7905; Lng = 78.7047; Taluk = "Srirangam" }
    
    "Bengaluru" = @{ State = "Karnataka"; Lat = 12.9716; Lng = 77.5946; Taluk = "Bengaluru South" }
    "Mysuru" = @{ State = "Karnataka"; Lat = 12.2958; Lng = 76.6394; Taluk = "Mysuru" }
    "Hubballi" = @{ State = "Karnataka"; Lat = 15.3647; Lng = 75.1240; Taluk = "Hubballi Urban" }
    
    "Lucknow" = @{ State = "Uttar Pradesh"; Lat = 26.8467; Lng = 80.9462; Taluk = "Sarojini Nagar" }
    "Kanpur" = @{ State = "Uttar Pradesh"; Lat = 26.4499; Lng = 80.3319; Taluk = "Kanpur Sadar" }
    "Varanasi" = @{ State = "Uttar Pradesh"; Lat = 25.3176; Lng = 82.9739; Taluk = "Pindra" }
    
    "Ahmedabad" = @{ State = "Gujarat"; Lat = 23.0225; Lng = 72.5714; Taluk = "Daskroi" }
    "Surat" = @{ State = "Gujarat"; Lat = 21.1702; Lng = 72.8311; Taluk = "Chorasi" }
    "Vadodara" = @{ State = "Gujarat"; Lat = 22.3072; Lng = 73.1812; Taluk = "Vadodara Urban" }
}

$StateCodes = @{
    "Maharashtra" = "MH"
    "Tamil Nadu" = "TN"
    "Karnataka" = "KA"
    "Uttar Pradesh" = "UP"
    "Gujarat" = "GJ"
    "Andhra Pradesh" = "AP"
    "Telangana" = "TG"
    "Rajasthan" = "RJ"
    "Kerala" = "KL"
}

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

$Stages = @("Proposal", "Scrutiny", "Approval", "Notification", "Award", "Compensation", "Possession", "R&R", "Completion")

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

# Output Collections
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

# Process 50 Rows
foreach ($row in $RawRows) {
    $rawId = $row.'Project ID'.Trim()
    $rawName = $row.'Project Name'.Trim()
    $rawType = $row.'Project Type'.Trim()
    $rawMinistry = $row.'Ministry'.Trim()
    $rawState = $row.'State'.Trim()
    $rawDistrict = $row.'District'.Trim()
    $rawReqLand = [double]$row.'Required Land'
    $rawAcqLand = [double]$row.'Acquired Land'
    $rawStartDate = $row.'Start Date'.Trim()
    $rawTargetDate = $row.'Target Date'.Trim()
    $rawStatus = $row.'Status'.Trim()
    
    # 1. Geographic Alignment (ensure district and state match)
    $geo = $GeoLookup[$rawDistrict]
    $state = if ($geo) { $geo.State } else { $rawState }
    $district = $rawDistrict
    $stateCode = if ($StateCodes[$state]) { $StateCodes[$state] } else { "IN" }
    $baseLat = if ($geo) { $geo.Lat } else { 19.0 }
    $baseLng = if ($geo) { $geo.Lng } else { 75.0 }
    $taluk = if ($geo) { $geo.Taluk } else { "$district Sadar" }
    
    # 2. Type Mapping
    $projectType = switch ($rawType) {
        "Highway" { "Highways" }
        "Railway Line" { "Railways" }
        "Rural Road" { "Public Infrastructure" }
        "Industrial Corridor" { "Industrial Corridor" }
        Default { "Public Infrastructure" }
    }
    
    # 3. Agency Mapping
    $agency = switch ($rawMinistry) {
        "Ministry of Road Transport" { "National Highways Authority of India (NHAI)" }
        "Ministry of Railways" { "Ministry of Railways (Railway Board)" }
        "Ministry of Heavy Industries" { "Ministry of Heavy Industries & Infrastructure" }
        Default { $rawMinistry }
    }
    
    # 4. Land metrics & calculations
    $landRequired = [Math]::Round($rawReqLand, 2)
    $landAcquired = [Math]::Min($landRequired, [Math]::Round($rawAcqLand, 2))
    $acqPct = if ($landRequired -gt 0) { [Math]::Round(($landAcquired / $landRequired) * 100.0, 1) } else { 0.0 }
    $acqPct = [Math]::Min(100.0, $acqPct)
    
    $landNotified = if ($rawStatus -eq "Completed") { $landRequired } else { [Math]::Min($landRequired, [Math]::Round($landAcquired + ($landRequired * 0.12), 2)) }
    
    # 5. Status, Stage, and Progress Percentages
    $stage = "Scrutiny"
    $status = "Under Scrutiny"
    $compPct = 0.0
    $possPct = 0.0
    $rrPct = 0.0
    
    if ($rawStatus -eq "Completed") {
        $status = "Completed"
        $stage = "Completion"
        $acqPct = 100.0
        $landAcquired = $landRequired
        $landNotified = $landRequired
        $compPct = 100.0
        $possPct = 100.0
        $rrPct = 100.0
    } elseif ($rawStatus -eq "Delayed") {
        $status = "Delayed"
        if ($acqPct -ge 75) { $stage = "Possession" }
        elseif ($acqPct -ge 40) { $stage = "Compensation" }
        elseif ($acqPct -ge 15) { $stage = "Award" }
        else { $stage = "Notification" }
        $compPct = [Math]::Round($acqPct * 0.7, 1)
        $possPct = [Math]::Round($acqPct * 0.4, 1)
        $rrPct = [Math]::Round($acqPct * 0.3, 1)
    } elseif ($rawStatus -eq "Planned") {
        $status = if ($acqPct -gt 0) { "Approved" } else { "Under Scrutiny" }
        $stage = if ($acqPct -gt 0) { "Approval" } else { "Scrutiny" }
        $compPct = [Math]::Round($acqPct * 0.5, 1)
        $possPct = 0.0
        $rrPct = 0.0
    } else {
        # In Progress
        if ($acqPct -ge 85) {
            $stage = "R&R"
            $status = "R&R In Progress"
            $compPct = [Math]::Min(100.0, [Math]::Round($acqPct * 0.95, 1))
            $possPct = [Math]::Min(100.0, [Math]::Round($acqPct * 0.85, 1))
            $rrPct = [Math]::Min(100.0, [Math]::Round($acqPct * 0.75, 1))
        } elseif ($acqPct -ge 55) {
            $stage = "Possession"
            $status = "Possession Pending"
            $compPct = [Math]::Min(100.0, [Math]::Round($acqPct * 0.9, 1))
            $possPct = [Math]::Min(100.0, [Math]::Round($acqPct * 0.7, 1))
            $rrPct = [Math]::Min(100.0, [Math]::Round($acqPct * 0.5, 1))
        } elseif ($acqPct -ge 30) {
            $stage = "Compensation"
            $status = "Compensation Pending"
            $compPct = [Math]::Min(100.0, [Math]::Round($acqPct * 0.75, 1))
            $possPct = [Math]::Min(100.0, [Math]::Round($acqPct * 0.4, 1))
            $rrPct = [Math]::Min(100.0, [Math]::Round($acqPct * 0.2, 1))
        } elseif ($acqPct -ge 15) {
            $stage = "Award"
            $status = "Award Declared"
            $compPct = [Math]::Min(100.0, [Math]::Round($acqPct * 0.5, 1))
            $possPct = 0.0
            $rrPct = 0.0
        } else {
            $stage = "Notification"
            $status = "Notification Issued"
            $compPct = 0.0
            $possPct = 0.0
            $rrPct = 0.0
        }
    }
    
    # 6. Financial & Socio-Economic Estimation
    $costPerHa = switch ($projectType) {
        "Highways" { 35.0 }
        "Railways" { 42.0 }
        "Industrial Corridor" { 28.0 }
        Default { 22.0 }
    }
    $estimatedCost = [Math]::Round($landRequired * $costPerHa + $Rand.Next(150, 600), 2)
    $compAssessed = [Math]::Round($estimatedCost * 0.25, 2)
    $compDisbursed = [Math]::Round(($compAssessed * $compPct) / 100.0, 2)
    
    $affFamilies = [Math]::Max(10, [int][Math]::Round($landRequired * (Get-RandomFloat 1.8 3.5)))
    $dispFamilies = [int][Math]::Round($affFamilies * (Get-RandomFloat 0.2 0.4))
    
    # 7. Predictive Risk
    $pendingParcelsCount = if ($rawStatus -eq "Completed") { 0 } else { $Rand.Next(1, 6) }
    $disputedParcelsCount = if ($rawStatus -eq "Delayed") { $Rand.Next(1, 4) } else { 0 }
    $compPendingPct = [Math]::Max(0.0, 100.0 - $compPct)
    $appDelay = if ($rawStatus -eq "Delayed") { $Rand.Next(30, 75) } else { 0 }
    $possDelay = if ($possPct -lt 50 -and $rawStatus -ne "Completed") { $Rand.Next(10, 40) } else { 0 }
    $rrPendingPct = [Math]::Max(0.0, 100.0 - $rrPct)
    
    $riskObj = if ($rawStatus -eq "Completed") {
        @{ Score = 15; Level = "LOW"; Recommendation = "Project successfully completed and handed over to executing authority."; CompRisk = 0; DisputeRisk = 0; PossessionRisk = 0; RrRisk = 0 }
    } else {
        Get-RiskPrediction $acqPct $pendingParcelsCount $disputedParcelsCount $compPendingPct $appDelay $possDelay $rrPendingPct
    }
    
    $desc = "$($rawName): $projectType project under $agency in $district, $state. Total required land: $landRequired ha across revenue subdivisions. Target completion date: $rawTargetDate."
    
    $projItem = [PSCustomObject]@{
        id = $rawId
        name = $rawName
        agency = $agency
        state = $state
        district = $district
        type = $projectType
        landRequired = $landRequired
        landAcquired = $landAcquired
        landNotified = $landNotified
        acquisitionPct = $acqPct
        compensationPct = $compPct
        possessionPct = $possPct
        rrPct = $rrPct
        status = $status
        stage = $stage
        targetDate = $rawTargetDate
        estimatedCost = $estimatedCost
        risk = $riskObj.Level
        riskScore = $riskObj.Score
        lastUpdated = "2026-08-$($Rand.Next(20, 28).ToString('D2')) $($Rand.Next(8, 18).ToString('D2')):$($Rand.Next(10, 59).ToString('D2'))"
        description = $desc
        parcels = @()
        affectedFamilies = $affFamilies
        displacedFamilies = $dispFamilies
        compensationAssessed = $compAssessed
        compensationDisbursed = $compDisbursed
    }
    
    # 8. Child Entities Generation
    # 8.1 Parcels
    $numParcels = if ($landRequired -gt 60) { $Rand.Next(5, 8) } else { $Rand.Next(3, 5) }
    $projParcelIds = @()
    for ($p = 1; $p -le $numParcels; $p++) {
        $pCode = "LP-$($ParcelCounter.ToString('D4'))-$stateCode"
        $ParcelCounter++
        $projParcelIds += $pCode
        
        $pAcqStat = if ($rawStatus -eq "Completed") { "Acquired" }
                    elseif ($rawStatus -eq "Delayed" -and $p -eq 1) { "Disputed" }
                    elseif ($acqPct -ge 50) { Get-RandomItem @("Acquired", "Acquired", "Notified") }
                    else { Get-RandomItem @("Notified", "Proposed", "Pending") }
        
        $pCompStat = if ($pAcqStat -eq "Acquired") { "Fully Paid" }
                     elseif ($pAcqStat -eq "Notified") { "Assessed" }
                     else { "Not Started" }
        
        $pPossStat = if ($rawStatus -eq "Completed" -or $pAcqStat -eq "Acquired") { "Handover Completed" } else { "Pending" }
        $pRrStat = if ($rawStatus -eq "Completed") { "Completed" } elseif ($pAcqStat -eq "Acquired") { "In Progress" } else { "Eligible" }
        
        $parcelArea = [Math]::Round($landRequired / $numParcels, 2)
        
        $LandParcels.Add([PSCustomObject]@{
            id = $pCode
            projectId = $rawId
            surveyNumber = "$($Rand.Next(10, 600))/$($Rand.Next(1, 9))$([char]$Rand.Next(65, 67))"
            village = Get-RandomItem $Villages
            taluk = $taluk
            district = $district
            state = $state
            area = $parcelArea
            landType = Get-RandomItem $LandTypes
            ownershipType = Get-RandomItem $OwnershipTypes
            lat = [Math]::Round($baseLat + (($Rand.NextDouble() - 0.5) * 0.4), 5)
            lng = [Math]::Round($baseLng + (($Rand.NextDouble() - 0.5) * 0.4), 5)
            acquisitionStatus = $pAcqStat
            compensationStatus = $pCompStat
            possessionStatus = $pPossStat
            rrStatus = $pRrStat
            ownerCount = $Rand.Next(1, 6)
        })
    }
    $projItem.parcels = $projParcelIds
    $Projects.Add($projItem)
    
    # 8.2 Notifications
    $notifTypes = @("Preliminary Notification", "Declaration", "Award Notification", "Possession Notice")
    $numNotifs = if ($rawStatus -eq "Completed") { 3 } else { $Rand.Next(1, 3) }
    for ($n = 0; $n -lt $numNotifs; $n++) {
        $nCode = "NOT-$($NotifCounter.ToString('D4'))"
        $NotifCounter++
        $Notifications.Add([PSCustomObject]@{
            id = $nCode
            projectId = $rawId
            projectName = $rawName
            type = $notifTypes[$n]
            number = "$stateCode-LA/2025/$($Rand.Next(100, 999))"
            issueDate = $rawStartDate
            publicationDate = $rawStartDate
            status = if ($rawStatus -eq "Completed") { "Published" } else { Get-RandomItem @("Published", "Issued") }
            remarks = "Published under Section 11/19 RFCTLARR 2013 in State Gazette."
        })
    }
    
    # 8.3 Awards
    if ($acqPct -ge 20 -or $rawStatus -eq "Completed") {
        $aCode = "AWD-$($AwardCounter.ToString('D4'))"
        $AwardCounter++
        $Awards.Add([PSCustomObject]@{
            id = $aCode
            projectId = $rawId
            district = $district
            village = Get-RandomItem $Villages
            surveyNumber = "$($Rand.Next(10, 300))/$($Rand.Next(1, 5))"
            awardDate = "2025-11-20"
            landArea = [Math]::Round($landAcquired * 0.6, 2)
            awardAmount = [Math]::Round($compAssessed * 0.7, 2)
            beneficiaryCount = $Rand.Next(5, 35)
            status = if ($rawStatus -eq "Completed") { "Declared" } else { "Approved" }
        })
    }
    
    # 8.4 Compensation Records
    $numComps = $Rand.Next(2, 5)
    for ($c = 1; $c -le $numComps; $c++) {
        $cCode = "CMP-$($CompCounter.ToString('D5'))"
        $CompCounter++
        $cAssessed = [Math]::Round($compAssessed / $numComps, 2)
        $cApproved = $cAssessed
        $cPaid = if ($rawStatus -eq "Completed") { $cApproved } else { [Math]::Round(($cApproved * $compPct) / 100.0, 2) }
        $cStat = if ($cPaid -ge $cApproved) { "Fully Paid" } elseif ($cPaid -gt 0) { "Partially Paid" } else { "Payment Pending" }
        
        $CompensationRecords.Add([PSCustomObject]@{
            id = $cCode
            projectId = $rawId
            projectName = $rawName
            district = $district
            beneficiaryId = "BEN-$($Rand.Next(10000, 99999))"
            landArea = [Math]::Round($landRequired / ($numComps * 2), 2)
            assessedAmount = $cAssessed
            approvedAmount = $cApproved
            paidAmount = $cPaid
            paymentDate = if ($cPaid -gt 0) { "2026-02-15" } else { $null }
            status = $cStat
        })
    }
    
    # 8.5 Affected Families
    $numFams = $Rand.Next(3, 7)
    $famCats = @("Title Holder", "Occupant", "Tenant", "Agricultural Labour", "Artisan")
    $rrBens = @("Housing Plot", "Employment", "Financial Assistance", "Land Allotment", "Multiple Benefits")
    for ($f = 1; $f -le $numFams; $f++) {
        $fCode = "FAM-$($FamCounter.ToString('D5'))"
        $FamCounter++
        $AffectedFamilies.Add([PSCustomObject]@{
            id = $fCode
            projectId = $rawId
            district = $district
            village = Get-RandomItem $Villages
            category = Get-RandomItem $famCats
            landAffected = Get-RandomFloat 0.5 8.0 2
            displacementStatus = Get-RandomItem @("Not Displaced", "Partially Displaced", "Fully Displaced")
            compensationStatus = if ($rawStatus -eq "Completed") { "Fully Paid" } else { "Assessed" }
            rrEligibility = $true
            rrBenefit = Get-RandomItem $rrBens
            rrStatus = if ($rawStatus -eq "Completed") { "Completed" } else { "In Progress" }
        })
    }
    
    # 8.6 Milestones
    $auths = @("PWD Agency", "District Authority", "State Government", "Central Ministry", "Land Acquisition Officer", "R&R Officer")
    $currentStageIdx = $Stages.IndexOf($stage)
    $mDelaySum = 0
    
    for ($m = 0; $m -lt $Stages.Count; $m++) {
        $msCode = "MS-$($MsCounter.ToString('D5'))"
        $MsCounter++
        $stgName = $Stages[$m]
        
        $mStat = "Pending"
        $actDate = $null
        $mDelay = 0
        $rem = "Scheduled as per project implementation plan."
        
        if ($m -lt $currentStageIdx -or $rawStatus -eq "Completed") {
            $mStat = "Completed"
            $actDate = "2025-10-15"
            if ($rawStatus -eq "Delayed" -and $m -eq 1) {
                $mDelay = $Rand.Next(25, 60)
                $mStat = "Delayed"
                $rem = "Delayed by $mDelay days during inter-departmental verification."
                $mDelaySum += $mDelay
            }
        } elseif ($m -eq $currentStageIdx) {
            $mStat = "In Progress"
            $rem = "Active statutory stage."
        }
        
        $Milestones.Add([PSCustomObject]@{
            id = $msCode
            projectId = $rawId
            stage = $stgName
            plannedDate = $rawStartDate
            actualDate = $actDate
            authority = $auths[[Math]::Min($m, $auths.Count - 1)]
            status = $mStat
            delayDays = $mDelay
            remarks = $rem
        })
    }
    
    # 8.7 Alerts
    if ($rawStatus -eq "Delayed" -or $riskObj.Level -in @("CRITICAL", "HIGH")) {
        $alCode = "ALT-$($AlertCounter.ToString('D4'))"
        $AlertCounter++
        $Alerts.Add([PSCustomObject]@{
            id = $alCode
            type = if ($rawStatus -eq "Delayed") { "Delayed Approval" } else { "Compensation Delay" }
            severity = if ($riskObj.Level -eq "CRITICAL") { "Critical" } else { "High" }
            projectId = $rawId
            projectName = $rawName
            description = "SLA Alert: Critical acquisition bottleneck identified for $rawName. Target date $rawTargetDate at risk."
            createdDate = "2026-08-25 10:30"
            escalationLevel = "District"
            status = "Open"
        })
    }
    
    # 8.8 Workflow Tasks
    if ($rawStatus -ne "Completed") {
        $wfCode = "WF-$($WfCounter.ToString('D4'))"
        $WfCounter++
        $WorkflowTasks.Add([PSCustomObject]@{
            id = $wfCode
            projectId = $rawId
            projectName = $rawName
            currentStage = $stage
            assignedTo = "Land Acquisition Officer"
            assignedRole = "land_acquisition_officer"
            status = "Pending"
            createdDate = "2026-08-24"
            description = "Review statutory files and expedite stage advancement for $stage."
            priority = if ($rawStatus -eq "Delayed") { "High" } else { "Medium" }
        })
    }
    
    # 8.9 Documents
    $docCats = @("DPR", "Land Records", "Notifications", "Awards", "Government Orders")
    for ($d = 0; $d -lt 3; $d++) {
        $dCode = "DOC-$($DocCounter.ToString('D5'))"
        $DocCounter++
        $dCat = $docCats[$d]
        $Documents.Add([PSCustomObject]@{
            id = $dCode
            projectId = $rawId
            projectName = $rawName
            category = $dCat
            fileName = "$($dCat -replace '\s','_')_$rawId.pdf"
            uploadedBy = "District Revenue Officer"
            uploadDate = "2025-09-10"
            version = "v1.0"
            status = "Verified"
            size = "$($Rand.Next(400, 3500)) KB"
        })
    }
    
    # 8.10 ML Training Feature Row
    $MLTrainingData.Add([PSCustomObject]@{
        projectId = $rawId
        projectName = $rawName
        state = $state
        projectType = $projectType
        landRequired = $landRequired
        landAcquired = $landAcquired
        land_acquisition_percentage = $acqPct
        pending_parcels = $pendingParcelsCount
        disputed_parcels = $disputedParcelsCount
        compensation_pending_percentage = $compPendingPct
        approval_delay_days = $mDelaySum
        possession_delay_days = $possDelay
        rr_pending_percentage = $rrPendingPct
        risk_score = $riskObj.Score
        risk_level = $riskObj.Level
        recommendation = $riskObj.Recommendation
    })
    
    $RiskPredictions.Add([PSCustomObject]@{
        projectId = $rawId
        projectName = $rawName
        riskScore = $riskObj.Score
        riskLevel = $riskObj.Level
        recommendation = $riskObj.Recommendation
        factors = @(
            @{ name = "Compensation Pending"; value = "$compPendingPct%"; weight = $riskObj.CompRisk },
            @{ name = "Land Disputes"; value = "$disputedParcelsCount"; weight = $riskObj.DisputeRisk },
            @{ name = "Possession Delay"; value = "$possDelay days"; weight = $riskObj.PossessionRisk },
            @{ name = "R&R Pending"; value = "$rrPendingPct%"; weight = $riskObj.RrRisk }
        )
    })
}

# Audit Logs & Users
$Users = @(
    [ordered]@{ id = "U001"; name = "Arjun Mehta"; email = "central.mehta@nlams.gov.in"; role = "central_ministry"; department = "Ministry of Road Transport & Highways"; designation = "Joint Secretary (Land Admin)"; state = $null; district = $null; avatarColor = "#1e3a5f" },
    [ordered]@{ id = "U002"; name = "Sunita Rao"; email = "state.rao@nlams.gov.in"; role = "state_gov"; department = "PWD Tamil Nadu"; designation = "State Project Director"; state = "Tamil Nadu"; district = $null; avatarColor = "#2b6cb0" },
    [ordered]@{ id = "U003"; name = "Ramesh Iyer"; email = "district.iyer@nlams.gov.in"; role = "district_authority"; department = "District Collector Office"; designation = "District Collector & Magistrate"; state = "Tamil Nadu"; district = "Coimbatore"; avatarColor = "#2c7a7b" },
    [ordered]@{ id = "U004"; name = "Kavya Krishnan"; email = "pwd.krishnan@nlams.gov.in"; role = "pwd_agency"; department = "Infrastructure Engineering Cell"; designation = "Superintending Engineer"; state = "Tamil Nadu"; district = "Coimbatore"; avatarColor = "#2d3748" },
    [ordered]@{ id = "U005"; name = "Thomas Joseph"; email = "lao.joseph@nlams.gov.in"; role = "land_acquisition_officer"; department = "Revenue & Land Acquisition Authority"; designation = "Special Land Acquisition Officer (CALA)"; state = "Tamil Nadu"; district = "Coimbatore"; avatarColor = "#744210" },
    [ordered]@{ id = "U006"; name = "Meera Nair"; email = "rr.nair@nlams.gov.in"; role = "rr_officer"; department = "Rehabilitation & Resettlement Division"; designation = "Director (R&R Operations)"; state = "Tamil Nadu"; district = "Coimbatore"; avatarColor = "#22543d" },
    [ordered]@{ id = "U007"; name = "Vikram Singh"; email = "admin.singh@nlams.gov.in"; role = "system_admin"; department = "NLAMS IT Infrastructure Cell"; designation = "Lead Security & System Administrator"; state = $null; district = $null; avatarColor = "#4a5568" }
)

for ($i = 1; $i -le 100; $i++) {
    $AuditLogs.Add([PSCustomObject]@{
        id = "AUD-$($i.ToString('D5'))"
        timestamp = "27-Aug-2026 14:22"
        user = "District Officer Ramesh"
        role = "District Authority"
        module = "Projects"
        action = "UPDATE"
        recordId = (Get-RandomItem $Projects).id
        description = "Project land verification status updated via authorized terminal."
        origin = "ONLINE"
        syncTimestamp = $null
    })
}

for ($s = 1; $s -le 25; $s++) {
    $SyncQueue.Add([PSCustomObject]@{
        id = "SYN-$($s.ToString('D4'))"
        module = "Land Verification"
        recordId = (Get-RandomItem $LandParcels).id
        action = "UPDATE"
        createdTime = "2026-08-27 11:30"
        retryCount = 0
        status = "Synchronized"
        lastError = $null
    })
}

# ==============================================================================
# Write Output Files
# ==============================================================================
Write-Host "Writing Matched JSON Datasets..." -ForegroundColor Green
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

Write-Host "Writing Matched CSV Datasets..." -ForegroundColor Green
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

# SQL Seed
Write-Host "Writing Matched SQL Seed Data..." -ForegroundColor Green
$SeedLines = [System.Collections.Generic.List[string]]::new()
$SeedLines.Add("-- NLAMS Fully Matched Data Seed Script (50 Projects + Relations)")
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

Write-Host "============================================================" -ForegroundColor Green
Write-Host " 50-Project Dataset Successfully Transformed & Matched!" -ForegroundColor Green
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
Write-Host "ML Training Samples:  $($MLTrainingData.Count)" -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Green
