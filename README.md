# 테트리스 (교육용)

HTML, CSS, JavaScript만 사용하는 브라우저 테트리스 프로젝트입니다.  
빌드 도구와 외부 라이브러리 없이 바로 실행할 수 있습니다.

## 온라인 플레이

**https://sungmok-karl-seo.github.io/tetris/**

## 실행 방법

### 로컬

1. 이 프로젝트 폴더를 연다.
2. `index.html`을 더블 클릭하거나 브라우저 창으로 드래그한다.
3. **시작** 버튼을 누른 뒤 키보드로 블록을 조작한다.

VS Code / Cursor에서는 **Live Server** 확장으로 `index.html`을 열어도 됩니다.

## 구현 기능

- 게임 보드 (10×20 CSS Grid, 모바일 반응형)
- 7종 블록 (I, O, T, S, Z, J, L)
- 자동 낙하 및 충돌 판정 (`canMove`)
- 키보드 조작 (이동, 회전, soft drop, hard drop)
- 블록 고정 및 새 블록 생성
- 라인 삭제 및 점수 증가
- 게임 오버 및 재시작

## 점수 규칙

| 한 번에 삭제한 줄 | 점수 |
|---|---|
| 1줄 | 100 |
| 2줄 | 300 |
| 3줄 | 500 |
| 4줄 | 800 |

## 게임 오버

- 새 블록을 스폰할 공간이 없으면 게임 오버가 됩니다.
- 게임 오버 후 **재시작** 버튼을 눌러 다시 플레이합니다.

## 조작법

**시작** 버튼을 누른 후 키보드로 조작합니다.

| 키 | 동작 |
|---|---|
| ← (ArrowLeft) | 왼쪽 이동 |
| → (ArrowRight) | 오른쪽 이동 |
| ↓ (ArrowDown) | 한 칸 빠르게 내리기 (soft drop) |
| ↑ (ArrowUp) | 블록 회전 |
| Space | hard drop (즉시 낙하) |

- 벽이나 고정 블록과 충돌하면 이동·회전은 적용되지 않습니다.
- 모바일에서는 블루투스 키보드 또는 화살표 키가 있는 화면 키보드가 필요합니다.

## GitHub Pages 배포 방법

1. 저장소 **Settings** → **Pages**
2. **Source**: Deploy from a branch
3. **Branch**: `main` / `/ (root)`
4. **Save**

배포 후 접속: **https://sungmok-karl-seo.github.io/tetris/**

## 파일 구조

```
tetris/
├── index.html    # 게임 화면 구조
├── style.css     # 화면 스타일 (반응형)
├── script.js     # 게임 데이터 + 로직 + 렌더링
└── README.md     # 이 파일
```

## 저장소

- GitHub: [https://github.com/sungmok-karl-seo/tetris](https://github.com/sungmok-karl-seo/tetris)
