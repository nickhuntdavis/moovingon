# Baserow Field Mapping Report

## App Item Interface Fields

Based on `types.ts`, the app uses these fields:
- `id` (string)
- `title` (string)
- `description` (string, optional)
- `price` (number)
- `condition` (Condition enum)
- `status` (ItemStatus: 'AVAILABLE' | 'RESERVED' | 'TAKEN')
- `images` (string[])
- `interestedParties` (Interest[])
- `createdAt` (number - timestamp)

## Baserow Table Fields (from your table)

1. **Name** (text) - Field ID: 6697990
2. **price** (number) - Field ID: 6697991
3. **condition** (single_select) - Field ID: 6697992
   - Options: "Good as new", "Fair", "Well loved"
4. **description** (long_text) - Field ID: 6698012
5. **image_1** (file) - Field ID: 6698029
6. **image_2** (file) - Field ID: 6698030
7. **image_3** (file) - Field ID: 6698031
8. **image_4** (file) - Field ID: 6698032
9. **status** (single_select) - Field ID: 6698033
   - Options: "Available", "Reserved", "Taken"
10. **taker_1_name** (text) - Field ID: 6698034
11. **taker_1_time** (date) - Field ID: 6698037
12. **taker_2_name** (text) - Field ID: 6698040
13. **taker_2_time** (date) - Field ID: 6698041
14. **taker_3_name** (text) - Field ID: 6698042
15. **taker_3_time** (date) - Field ID: 6698043
16. **taker_4_name** (text) - Field ID: 6698044
17. **taker_4_time** (date) - Field ID: 6698045

## Current Mapping Configuration

### ✅ Correctly Mapped Fields

| App Field | Baserow Field | Type | Status |
|-----------|---------------|------|--------|
| `id` | `id` | ID | ✅ Mapped |
| `title` | `Name` | text | ✅ Mapped |
| `description` | `description` | long_text | ✅ Mapped |
| `price` | `price` | number | ✅ Mapped |
| `condition` | `condition` | single_select | ✅ Mapped (with value conversion) |
| `status` | `status` | single_select | ✅ Mapped (with value conversion) |

### ✅ Complex Field Mappings

| App Field | Baserow Fields | Mapping Logic | Status |
|-----------|----------------|---------------|--------|
| `images` (string[]) | `image_1`, `image_2`, `image_3`, `image_4` | Combined from 4 file fields | ✅ Mapped (reads from file arrays) |
| `interestedParties` (Interest[]) | `taker_1_name`, `taker_1_time`, `taker_2_name`, `taker_2_time`, etc. | Combined from 4 taker pairs | ✅ Mapped |

### ⚠️ Value Mappings

#### Status Mapping (Baserow → App)
- `"Available"` → `"AVAILABLE"` ✅
- `"Reserved"` → `"RESERVED"` ✅
- `"Taken"` → `"TAKEN"` ✅

#### Condition Mapping (Baserow → App)
- `"Good as new"` → `"Good as new"` ✅
- `"Fair"` → `"Fair"` ✅
- `"Well loved"` → `"Well Loved"` ⚠️ **POTENTIAL ISSUE**: Baserow has "Well loved" but app expects "Well Loved" (capital L)

### ❌ Missing/Not Mapped

| App Field | Baserow Equivalent | Status |
|-----------|-------------------|--------|
| `createdAt` | None | ⚠️ No Baserow field - uses `Date.now()` when reading |

## Issues Found

### 1. Condition Value Mismatch ⚠️
- **Baserow**: "Well loved" (lowercase 'l')
- **App Condition enum**: "Well Loved" (capital 'L')
- **Impact**: May cause mapping issues when reading/writing
- **Fix Needed**: Update `CONDITION_MAPPING` to handle both cases

### 2. Image Field Updates ⚠️
- **Issue**: File fields don't accept URL strings
- **Current Behavior**: Skips updating file fields when values are URLs
- **Impact**: Images can't be updated via URL (only via file upload)
- **Status**: Handled with workaround (skips URL updates)

### 3. Missing createdAt Field
- **Issue**: No `createdAt` field in Baserow table
- **Current Behavior**: Uses `Date.now()` when reading items
- **Impact**: Created timestamps are lost/regenerated on each read
- **Recommendation**: Add a `created_at` date field to Baserow table (optional)

## Verification Checklist

- [x] `title` → `Name` ✅
- [x] `description` → `description` ✅
- [x] `price` → `price` ✅
- [x] `condition` → `condition` (with value mapping) ✅
- [x] `status` → `status` (with value mapping) ✅
- [x] `images` → `image_1` through `image_4` ✅
- [x] `interestedParties` → `taker_*_name` and `taker_*_time` ✅
- [ ] `createdAt` → No field (uses current time) ⚠️

## Recommendations

1. **Fix Condition Mapping**: Update to handle "Well loved" vs "Well Loved"
2. **Consider Adding createdAt**: Add a date field to Baserow for proper timestamp tracking
3. **Image Upload**: Consider implementing proper file upload for images (currently URLs are skipped)

