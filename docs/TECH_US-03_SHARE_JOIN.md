# Tech-Doc: US-03 - Zugangscode generieren & beitreten

**Story:** #13 - Zugangscode generieren & beitreten  
**Story Points:** 5  
**Priorität:** Must Have (MH)  
**Status:** Zu implementieren  
**Abhängigkeit:** US-01 (Einkaufsliste erstellen)

---

## 1. Überblick

Diese Story ermöglicht es Benutzern, einen eindeutigen Zugangscode (URL) für ihre Einkaufsliste zu generieren und zu teilen. Andere Benutzer können über diesen Code der Liste beitreten und einen Anzeigenamen wählen.

---

## 2. Akzeptanzkriterien

| # | Kriterium | Beschreibung |
|---|-----------|--------------|
| 1 | Code generieren | 6-stelliger alphanumerischer Code wird erstellt |
| 2 | URL-Generierung | Vollständige URL mit Code wird erstellt |
| 3 | Teilen-Button | Copy-to-Clipboard oder Share-API |
| 4 | Beitreten-Dialog | Eingabe von Code und Anzeigenamen |
| 5 | Anzeigename | Pflichtfeld beim Beitritt |
| 6 | Teilnehmer-Liste | Zeigt alle Benutzer der Liste |

---

## 3. UI/UX Anforderungen

### 3.1 Share/Code-Dialog

```
┌─────────────────────────────────┐
│  ✕                              │
│  ┌───────────────────────────┐ │
│  │ 🔗 Liste teilen          │ │
│  └───────────────────────────┘ │
│                                 │
│  Code:                          │
│  ┌───────────────────────────┐ │
│  │ ABC123        📋 [Kopieren]│ │
│  └───────────────────────────┘ │
│                                 │
│  URL:                           │
│  ┌───────────────────────────┐ │
│  │ https://app.example.com/ │ │
│  │ join/ABC123    📋 [Kopieren]│ │
│  └───────────────────────────┘ │
│                                 │
│         [Schließen]              │
└─────────────────────────────────┘
```

### 3.2 Beitritts-Dialog

```
┌─────────────────────────────────┐
│  ✕                              │
│  ┌───────────────────────────┐ │
│  │ 🤝 Liste beitreten       │ │
│  └───────────────────────────┘ │
│                                 │
│  ┌───────────────────────────┐ │
│  │  Zugangscode eingeben...  │ │
│  └───────────────────────────┘ │
│                                 │
│  ┌───────────────────────────┐ │
│  │  Dein Name...            │ │
│  └───────────────────────────┘ │
│                                 │
│         [Abbrechen] [Beitreten] │
└─────────────────────────────────┘
```

### 3.3 Teilnehmer-Header

```
┌─────────────────────────────────┐
│  Einkaufsliste                  │
│  👥 3 Teilnehmer                │
│  ────────────────────────────── │
│  [Teilen] [Einstellungen]        │
└─────────────────────────────────┘
```

---

## 4. Datenmodell

### 4.1 User/List Membership

```typescript
interface ListMember {
  id: string
  listId: string
  displayName: string
  joinedAt: string
}
```

### 4.2 API-Requests

```typescript
// POST /api/lists/{id}/share - Link generieren
interface GenerateShareLinkResponse {
  accessCode: string
  shareUrl: string
}

// POST /api/lists/join - Liste beitreten
interface JoinListRequest {
  accessCode: string
  displayName: string
}
```

### 4.3 API-Responses

```typescript
interface JoinListResponse {
  list: ShoppingList
  member: ListMember
}

interface GenerateShareLinkResponse {
  accessCode: string
  shareUrl: string
}
```

---

## 5. Implementierung

### 5.1 Frontend - Share Dialog

```vue
<!-- src/components/ShareListDialog.vue -->

<template>
  <v-dialog v-model="show" max-width="440">
    <v-card>
      <v-card-title>
        <v-icon icon="mdi-share-variant" class="mr-2" />
        Liste teilen
      </v-card-title>
      
      <v-card-text>
        <div class="mb-4">
          <div class="text-caption text-medium-emphasis mb-1">Zugangscode</div>
          <div class="d-flex align-center">
            <v-chip
              color="primary"
              variant="flat"
              size="large"
              class="font-weight-bold letter-spacing"
            >
              {{ accessCode }}
            </v-chip>
            <v-btn
              icon="mdi-content-copy"
              variant="text"
              class="ml-2"
              @click="copyCode"
            />
          </div>
        </div>

        <div class="mb-4">
          <div class="text-caption text-medium-emphasis mb-1">Teilen-Link</div>
          <div class="d-flex align-center">
            <v-text-field
              :model-value="shareUrl"
              readonly
              density="compact"
              hide-details
            />
            <v-btn
              icon="mdi-content-copy"
              variant="text"
              class="ml-1"
              @click="copyUrl"
            />
          </div>
        </div>

        <v-divider class="my-4" />

        <div class="text-caption text-medium-emphasis mb-2">
          <v-icon icon="mdi-account-group" size="14" class="mr-1" />
          {{ members.length }} Teilnehmer
        </div>
        <v-list density="compact" class="bg-transparent">
          <v-list-item
            v-for="member in members"
            :key="member.id"
            :title="member.displayName"
            :subtitle="formatDate(member.joinedAt)"
          >
            <template #prepend>
              <v-avatar color="primary" size="32">
                {{ member.displayName.charAt(0).toUpperCase() }}
              </v-avatar>
            </template>
          </v-list-item>
        </v-list>
      </v-card-text>
      
      <v-card-actions>
        <v-spacer />
        <v-btn @click="show = false">Schließen</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
const props = defineProps<{
  listId: string
  accessCode: string
  members: { id: string; displayName: string; joinedAt: string }[]
}>()

const emit = defineEmits<{
  (e: 'update:show', value: boolean): void
}>()

const show = computed({
  get: () => props.show,
  set: (val) => emit('update:show', val)
})

const shareUrl = computed(() => {
  return `${window.location.origin}/join/${props.accessCode}`
})

function copyCode() {
  navigator.clipboard.writeText(props.accessCode)
}

function copyUrl() {
  navigator.clipboard.writeText(shareUrl.value)
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('de-AT')
}
</script>
```

### 5.2 Frontend - Join Dialog

```vue
<!-- src/components/JoinListDialog.vue -->

<template>
  <v-dialog v-model="showJoin" max-width="440">
    <v-card>
      <v-card-title>
        <v-icon icon="mdi-account-plus" class="mr-2" />
        Liste beitreten
      </v-card-title>
      
      <v-card-text>
        <v-text-field
          v-model="joinCode"
          label="Zugangscode"
          placeholder="ABC123"
          maxlength="6"
          class="mb-4"
          :rules="[v => !!v?.trim() || 'Code eingeben']"
        />
        
        <v-text-field
          v-model="displayName"
          label="Dein Name"
          placeholder="z.B. Max"
          :rules="[v => !!v?.trim() || 'Name eingeben']"
        />
      </v-card-text>
      
      <v-card-actions>
        <v-spacer />
        <v-btn @click="showJoin = false">Abbrechen</v-btn>
        <v-btn
          color="primary"
          :disabled="!joinCode.trim() || !displayName.trim()"
          :loading="joining"
          @click="onJoin"
        >
          Beitreten
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const showJoin = defineModel<boolean>('modelValue')

const joinCode = ref('')
const displayName = ref('')
const joining = ref(false)

async function onJoin() {
  if (!joinCode.value.trim() || !displayName.value.trim()) return
  joining.value = true
  
  try {
    const response = await listService.join({
      accessCode: joinCode.value.trim().toUpperCase(),
      displayName: displayName.value.trim()
    })
    
    showJoin.value = false
    router.push(`/list/${response.list.id}`)
  } catch (e) {
    console.error('Join failed:', e)
  } finally {
    joining.value = false
  }
}
</script>
```

### 5.3 Backend - ListController

```java
// src/main/java/at/tgm/sirbuysalot/controller/ListController.java

@PostMapping("/{id}/share")
public ResponseEntity<Map<String, String>> generateShareLink(@PathVariable UUID id) {
    String accessCode = listService.generateAccessCode(id);
    String shareUrl = "/join/" + accessCode;
    
    return ResponseEntity.ok(Map.of(
        "accessCode", accessCode,
        "shareUrl", shareUrl
    ));
}

@PostMapping("/join")
public ResponseEntity<Map<String, Object>> joinList(@RequestBody @Valid JoinListRequest request) {
    ShoppingList list = listService.findByAccessCode(request.getAccessCode())
        .orElseThrow(() -> new BadRequestException("Ungültiger Code"));
    
    ListMember member = listService.addMember(list.getId(), request.getDisplayName());
    
    return ResponseEntity.ok(Map.of(
        "list", list,
        "member", member
    ));
}

@GetMapping("/{id}/members")
public ResponseEntity<List<ListMember>> getMembers(@PathVariable UUID id) {
    return ResponseEntity.ok(listService.getMembers(id));
}
```

### 5.4 Backend - ListService

```java
// src/main/java/at/tgm/sirbuysalot/service/ListService.java

@Transactional
public String generateAccessCode(UUID listId) {
    ShoppingList list = listRepository.findById(listId)
        .orElseThrow(() -> new NotFoundException("List not found"));
    
    String code = UUID.randomUUID().toString().substring(0, 6).toUpperCase();
    list.setAccessCode(code);
    listRepository.save(list);
    
    return code;
}

public Optional<ShoppingList> findByAccessCode(String accessCode) {
    return listRepository.findByAccessCode(accessCode.toUpperCase());
}

@Transactional
public ListMember addMember(UUID listId, String displayName) {
    ShoppingList list = listRepository.findById(listId)
        .orElseThrow(() -> new NotFoundException("List not found"));
    
    ListMember member = ListMember.builder()
        .list(list)
        .displayName(displayName)
        .joinedAt(LocalDateTime.now())
        .build();
    
    return memberRepository.save(member);
}

public List<ListMember> getMembers(UUID listId) {
    return memberRepository.findByListId(listId);
}
```

---

## 6. API-Endpunkte

| Methode | Endpunkt | Request | Response | Beschreibung |
|---------|----------|---------|----------|--------------|
| POST | `/api/lists/{id}/share` | - | `{ accessCode, shareUrl }` | Share-Link generieren |
| POST | `/api/lists/join` | `{ accessCode, displayName }` | `{ list, member }` | Liste beitreten |
| GET | `/api/lists/{id}/members` | - | `ListMember[]` | Mitglieder abrufen |

---

## 7. Tests

### 7.1 Unit Tests (Vitest)

```typescript
// src/tests/shareList.test.ts

describe('ShareList', () => {
  it('should generate access code', async () => {
    const list = await createList('Test')
    const result = await listService.share(list.id)
    
    expect(result.accessCode).toMatch(/^[A-Z0-9]{6}$/)
    expect(result.shareUrl).toContain(result.accessCode)
  })

  it('should copy code to clipboard', async () => {
    const mockClipboard = vi.fn()
    navigator.clipboard.writeText = mockClipboard
    
    copyCode('ABC123')
    
    expect(mockClipboard).toHaveBeenCalledWith('ABC123')
  })
})
```

### 7.2 Integration Tests (Backend)

```java
// src/test/java/ListControllerTest.java

@Test
void joinList_withValidCode_shouldReturn200() throws Exception {
    mockMvc.perform(post("/api/lists/join")
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"accessCode\": \"ABC123\", \"displayName\": \"Max\"}"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.list").exists())
        .andExpect(jsonPath("$.member.displayName").value("Max"));
}

@Test
void joinList_withInvalidCode_shouldReturn400() throws Exception {
    mockMvc.perform(post("/api/lists/join")
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"accessCode\": \"INVALID\", \"displayName\": \"Max\"}"))
        .andExpect(status().isBadRequest());
}
```

---

## 8. Abhängigkeiten

| Story | Typ | Beschreibung |
|-------|-----|--------------|
| US-01 | Benötigt | Liste muss existieren |
| US-02 | Benötigt | Listenname bearbeiten |
| US-08 | Baut auf | Wer/Wann anzeigen |

---

## 9. Definition of Done

- [ ] Share-Dialog mit Code-Anzeige implementiert
- [ ] Copy-to-Clipboard funktioniert
- [ ] Share API (Web Share API) für mobile Geräte
- [ ] Join-Dialog mit Code-Validierung
- [ ] REST-Endpunkte für Share/Join im Backend
- [ ] Teilnehmer-Liste wird angezeigt
- [ ] Unit-Tests vorhanden

---

## 10. Nächste Story

**US-05:** Tags zuweisen - Ermöglicht das Kategorisieren von Produkten mit Tags.
