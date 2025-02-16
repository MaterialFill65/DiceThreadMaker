import "./card.css";

export type Card = {
    name: string;
    num: number;
    background: string;
    main_img: string;
};
type Position = { x: number; y: number };

type Meta = {
    card: HTMLDivElement;
    position: { x?: number; y?: number };
    data: Card;
    times: number[];
};
type pointerMeta = {
    elements: { card: HTMLDivElement; clone: HTMLDivElement };
    shift: Position;
    meta: Meta;
    target_pos?: Position;
};

type Grid = (Meta | null)[][];

function createCardElement(data: Card) {
    const nameElement = document.createElement("h1");
    nameElement.id = "name";
    nameElement.textContent = data.name;
    const numElement = document.createElement("h2");
    numElement.id = "num";
    numElement.textContent = data.num.toString();
    const cardElement = document.createElement("div");
    const card_innerElement = document.createElement("div");
    cardElement.classList.add("card");
    cardElement.style.background = data.background;
    card_innerElement.classList.add("card-inner");
    card_innerElement.id = "cardInner";
    card_innerElement.style.background = data.background;
    cardElement.style.zIndex = "1";
    const mainImgElement = document.createElement("img");
    mainImgElement.src = data.main_img;
    const charDisplayElement = document.createElement("div");
    charDisplayElement.classList.add("card-charDisplay");
    nameElement.classList.add("card-charName");
    numElement.classList.add("card-charNum");
    charDisplayElement.appendChild(nameElement);
    charDisplayElement.appendChild(numElement);
    card_innerElement.appendChild(mainImgElement);
    card_innerElement.appendChild(charDisplayElement);
    cardElement.appendChild(card_innerElement);

    return cardElement;
}

function createCloneElement() {
    const clone = document.createElement("div");
    const clone_inner = document.createElement("div");
    clone.classList.add("card");
    clone.classList.add("card-clone");
    clone_inner.classList.add("card-inner");
    clone.style.zIndex = "-1";
    clone.style.pointerEvents = "none";
    clone.appendChild(clone_inner);
    clone.style.borderRadius =
        "calc(var(--card-inner-size) + var(--card-padding))";

    return clone;
}

export class cardGrid {
    private pointers: { [id: number]: pointerMeta | null } = {};
    private store: { [timer_id: number]: HTMLDivElement } = {};
    public grid: Grid = [[null]];
    public stage: HTMLDivElement = document.createElement("div");
    public outline: HTMLDivElement = document.createElement("div");
    public translates: Position = {
        x: 0,
        y: 0,
    };
    heightInput!: HTMLInputElement;
    widthInput!: HTMLInputElement;
    heightDiv!: HTMLDivElement;
    widthDiv!: HTMLDivElement;

    constructor(app: HTMLDivElement) {
        this.stage.classList.add("stage");
        let isDragging = false;
        let shiftX = 0;
        let shiftY = 0;
        let pointerId: number | null;

        this.createControlPanel(app);

        document.body.addEventListener("pointerdown", (e) => {
            const target = e.target as HTMLElement;
            if (
                Array.from(this.stage.children).some((child) =>
                    child.contains(target)
                ) ||
                (document.body !== target && app !== target && this.stage !== target)
            ) {
                return;
            }
            isDragging = true;
            shiftX = e.pageX - this.translates.x;
            shiftY = e.pageY - this.translates.y;
            this.stage.style.cursor = "grabbing";
            pointerId = e.pointerId;
        });

        document.body.addEventListener("pointerup", (e) => {
            if (pointerId !== e.pointerId) return;
            e.preventDefault();
            isDragging = false;
            this.stage.style.cursor = "default";
        });
        document.body.addEventListener("pointerleave", (e) => {
            if (pointerId !== e.pointerId) return;
            e.preventDefault();
            isDragging = false;
            this.stage.style.cursor = "default";
        });

        document.body.addEventListener("pointermove", (e) => {
            if (pointerId !== e.pointerId) return;
            if (!isDragging) return;
            e.preventDefault();
            const x = (this.translates.x = e.pageX - shiftX);
            const y = (this.translates.y = e.pageY - shiftY);
            this.stage.style.transform = `translate(${x}px, ${y}px)`;
            this.heightDiv.style.transform = `translate(${x - 100}px, ${y}px)`;
            this.widthDiv.style.transform = `translate(${x - 100}px, ${y - 50}px)`;
            this.outline.style.transform = `translate(${x}px, ${y}px)`;
        });
        this.outline.classList.add("outline")
    }

    set height(x: number) {
        if (x < this.grid.length) {
            for (let i = x; i < this.grid.length; i++) {
                for (let j = 0; j < this.grid[i].length; j++) {
                    if (this.grid[i][j] !== null) {
                        this.grid[i][j]!.card.remove();
                    }
                }
            }
            this.grid.length = x;
        } else {
            while (this.grid.length < x) {
                this.grid.push(new Array(this.width).fill(null));
            }
        }
        this.outline.style.height = `${this.grid.length * 166}px`;
        this.outline.style.width = `${this.grid[0].length * 316}px`;
        this.heightInput.value = x.toString();
    }
    get height() {
        return this.grid.length;
    }
    set width(x: number) {
        if (x < this.width) {
            for (let row of this.grid) {
                for (let i = x; i < row.length; i++) {
                    if (row[i] !== null) {
                        row[i]!.card.remove();
                    }
                }
                row.length = x;
            }
        } else {
            for (let row of this.grid) {
                while (row.length < x) {
                    row.push(null);
                }
            }
        }
        this.outline.style.height = `${this.grid.length * 166}px`;
        this.outline.style.width = `${this.grid[0].length * 316}px`;
        this.widthInput.value = x.toString();
    }
    get width() {
        return this.grid[0]!.length;
    }

    private findNull(x: number, y: number) {
        const normal_x = Math.min(Math.max(0, x), this.grid[0].length - 1); // 正規化
        const normal_y = Math.min(Math.max(0, y), this.grid.length - 1);
        return findNearestZeroBFS(this.grid, { x: normal_x, y: normal_y });
    }

    private startDrag(ev: PointerEvent, meta: Meta) {
        if (meta.position.x != null && meta.position.y != null) {
            const original_meta = this.grid[meta.position.y][meta.position.x];
            if (original_meta) {
                original_meta.times.forEach((timer_id) => {
                    clearTimeout(timer_id);
                });
                original_meta.times = [];
            }
            this.grid[meta.position.y][meta.position.x] = null;
        }
        const pos = meta.card.getBoundingClientRect();

        const shiftX = ev.clientX - pos.left;
        const shiftY = ev.clientY - pos.top;

        meta.card.style.zIndex = "2000";
        const clone = createCloneElement();
        clone.style.transform = `translate(${
            ev.pageX - shiftX
        }px, ${
            ev.pageY - shiftY
        }px)`;
        meta.card.style.transition = "border-radius 0.3s";
        meta.card.style.borderRadius =
            "calc(var(--card-inner-size) + var(--card-padding))";
        this.pointers[ev.pointerId] = {
            elements: { card: meta.card, clone },
            shift: { x: shiftX, y: shiftY },
            meta,
        };
        this.dragging(ev);
    }

    private dragging(ev: PointerEvent) {
        if (!this.pointers[ev.pointerId]) {
            return;
        }
        const { elements, shift } = this.pointers[ev.pointerId]!;

        elements.card.style.transform = `translate(${ev.pageX - this.translates.x - shift.x}px, ${ev.pageY - this.translates.y - shift.y
            }px)`;

        const pos = elements.card.getBoundingClientRect();
        const result = this.findNull(
            (pos.x - this.translates.x + pos.width / 2) / pos.width,
            (pos.y - this.translates.y + pos.height / 2) / pos.height
        );
        if (result) {
            const { x, y } = result;

            this.pointers[ev.pointerId]!.target_pos = { x, y };

            elements.clone.style.transform = `translate(${x * pos.width}px, ${y * pos.height
                }px)`;
        }
    }

    private stopDrag(ev: PointerEvent) {
        if (!this.pointers[ev.pointerId]) {
            return;
        }
        const { elements, shift, meta } = this.pointers[ev.pointerId]!;
        elements.card.style.transform = `translate(${ev.pageX - this.translates.x - shift.x}px, ${ev.pageY - this.translates.y - shift.y
            }px)`;
        const pos = elements.card.getBoundingClientRect();

        const target_pos = this.pointers[ev.pointerId]!.target_pos;
        if (target_pos) {
            const { x, y } = target_pos;
            elements.clone.style.transform = `translate(${x * pos.width}px, ${y * pos.height
                }px)`;

            elements.card.style.transition = "";
            elements.card.style.transitionDuration = "0.3s";
            elements.card.style.transform = `translate(${x * pos.width}px, ${y * pos.height
                }px)`;
            this.grid[meta.position.y!][meta.position.x!] = null;
            meta.position.x = x;
            meta.position.y = y;

            {
                const func = () => {
                    elements.card.style.borderRadius = "";
                    elements.card.style.zIndex = "1";
                };
                const id = setTimeout(func, 300);
                this.store[id] = elements.clone;
                setTimeout(() => {
                    this.store[id].remove();
                }, 300);
                meta.times.push(id);
            }
            {
                const func = () => {
                    elements.card.style.transitionDuration = "";
                    meta.times = [];
                };
                const id = setTimeout(func, 600);
                meta.times.push(id);
            }

            this.grid[y][x] = meta;
            this.resizeStage();

            return { x, y };
        } else {
            {
                const func = () => {
                    elements.card.style.borderRadius = "";
                    elements.card.style.zIndex = "1";
                };
                const id = setTimeout(func, 300);
                meta.times.push(id);
            }
            {
                const func = () => {
                    elements.card.style.transitionDuration = "";
                    meta.times = [];
                };
                const id = setTimeout(func, 600);
                meta.times.push(id);
            }
        }
        this.pointers[ev.pointerId]!.meta = meta;
    }

    private createEditModal(meta: Meta) {
        const modal = document.createElement("div");
        modal.className = "edit-modal";

        const modalContent = document.createElement("div");
        modalContent.className = "edit-modal-content";

        const title = document.createElement("h2");
        title.textContent = "カードを編集";
        modalContent.appendChild(title);

        const form = document.createElement("form");
        form.className = "edit-form";

        const nameLabel = document.createElement("label");
        nameLabel.textContent = "名前:";
        form.appendChild(nameLabel);

        const nameInput = document.createElement("input");
        nameInput.value = meta.data.name;
        form.appendChild(nameInput);

        const backgroundLabel = document.createElement("label");
        backgroundLabel.textContent = "背景色:";
        form.appendChild(backgroundLabel);

        const backgroundInput = document.createElement("input");
        backgroundInput.type = "color";
        backgroundInput.value = meta.data.background;
        form.appendChild(backgroundInput);

        const imgLabel = document.createElement("label");
        imgLabel.textContent = "画像URL:";
        form.appendChild(imgLabel);

        const imgInput = document.createElement("input");
        imgInput.value = meta.data.main_img;
        form.appendChild(imgInput);

        const buttonContainer = document.createElement("div");
        buttonContainer.className = "button-container";

        const saveButton = document.createElement("button");
        saveButton.textContent = "保存";
        saveButton.type = "button";
        saveButton.onclick = () => {
            meta.data.name = nameInput.value;
            meta.data.background = backgroundInput.value;
            meta.data.main_img = imgInput.value;

            meta.card.querySelector("h1#name")!.textContent = meta.data.name;
            meta.card.style.background = meta.data.background;
            (
                meta.card.querySelector("div#cardInner")! as HTMLDivElement
            ).style.background = meta.data.background;
            meta.card.querySelector("img")!.src = meta.data.main_img;
            modal.remove();
        };
        buttonContainer.appendChild(saveButton);

        const cancelButton = document.createElement("button");
        cancelButton.textContent = "キャンセル";
        cancelButton.type = "button";
        cancelButton.onclick = () => {
            modal.remove();
        };
        buttonContainer.appendChild(cancelButton);

        form.appendChild(buttonContainer);
        modalContent.appendChild(form);
        modal.appendChild(modalContent);

        document.body.appendChild(modal);
        return modal;
    }

    private onContextMenu(meta: Meta) {
        return (ev: MouseEvent) => {
            const menu = document.createElement("div");
            menu.className = "context-menu";
            const editItem = document.createElement("div");
            editItem.className = "context-menu-item";
            editItem.textContent = "編集";

            const clickHandle = (ev: MouseEvent) => {
                if (
                    ev.target === menu &&
                    Array.from(menu.children).includes(ev.target as Element)
                ) {
                    return;
                }
                menu.remove();
                document.body.removeEventListener("click", clickHandle);
            };
            editItem.onclick = () => {
                const modal = this.createEditModal(meta);
                modal.style.display = "flex";
                menu.style.display = "none";
                menu.remove();

                document.body.removeEventListener("click", clickHandle);
            };
            menu.appendChild(editItem);

            const deleteItem = document.createElement("div");
            deleteItem.className = "context-menu-item";
            deleteItem.textContent = "削除";
            deleteItem.style.color = "red";
            deleteItem.onclick = () => {
                meta.card.remove();
                menu.style.display = "none";
                menu.remove();
                document.body.removeEventListener("click", clickHandle);
            };
            menu.appendChild(deleteItem);

            document.body.appendChild(menu);
            document.body.addEventListener("click", clickHandle);

            ev.preventDefault();
            menu.style.display = "flex";
            menu.style.left = `${ev.pageX}px`;
            menu.style.top = `${ev.pageY}px`;
        };
    }

    public addCard(data: Card) {
        data = structuredClone(data);
        const card = createCardElement(data);
        this.stage.appendChild(card);
        const meta: Meta = {
            card,
            position: {},
            data,
            times: [],
        };
        card.oncontextmenu = this.onContextMenu(meta);
        card.addEventListener("pointerdown", (ev) => {
            if (ev.button === 2) {
                return;
            }
            console.log(ev.type);
            this.startDrag(ev, meta);
            card.after(this.pointers[ev.pointerId]!.elements.clone);

            const drag = (e: PointerEvent) => this.dragging(e);

            document.body.addEventListener("pointermove", drag);
            const out = (e: PointerEvent) => {
                if (this.pointers[e.pointerId]) {
                    console.log(e.type, this.pointers[e.pointerId]?.elements.card);
                    document.body.removeEventListener("pointermove", drag);
                    this.stopDrag(e);
                    card.removeEventListener("pointerup", out);
                    document.body.removeEventListener("pointerleave", out);
                    this.pointers[e.pointerId] = null;
                }
            };
            card.addEventListener("pointerup", out);
            document.body.addEventListener("pointerleave", out);
            // document.body.addEventListener("pointerout", out);
        });

        const pos = card.getBoundingClientRect();
        const result = findFirstZero(this.grid, { x: 0, y: 0 });

        if (result) {
            const { x, y } = result;

            card.style.transition = "";
            card.style.transitionDuration = "0.3s";
            card.style.transform = `translate(${x * pos.width}px, ${y * pos.height
                }px)`;
            meta.position.x = x;
            meta.position.y = y;
            this.grid[y][x] = meta;
            this.resizeStage();

            setTimeout(() => {
                card.style.borderRadius = "";
                card.style.zIndex = "1";
                setTimeout(() => {
                    card.style.transitionDuration = "";
                }, 300);
            }, 300);

            return { x, y };
        } else {
            setTimeout(() => {
                card.style.borderRadius = "";
                card.style.zIndex = "1";
                setTimeout(() => {
                    card.style.transitionDuration = "";
                }, 300);
            }, 300);
        }
    }

    public resizeStage() {
        let counter = 1;
        for (let y = 0; y < this.grid.length; y++) {
            for (let x = 0; x < this.grid[y].length; x++) {
                if (this.grid[y][x] !== null) {
                    this.grid[y][x]!.data.num = counter++;
                    this.grid[y][x]!.card.querySelector("h2#num")!.textContent =
                        this.grid[y][x]!.data.num.toString();
                }
            }
        }
        const result = findMinRectangle(this.grid);
        if (result) {
            this.stage.style.width = `${(result.width + result.x) * 316}px`;
            this.stage.style.height = `${(result.height + result.y) * 166}px`;
        }
    }

    private createControlPanel(app: HTMLDivElement) {
        const controlPanel = document.createElement("div");
        controlPanel.className = "control-panel";

        this.heightDiv = document.createElement("div");

        const heightLabel = document.createElement("label");
        heightLabel.textContent = "高さ:";
        this.heightDiv.appendChild(heightLabel);

        this.heightInput = document.createElement("input");
        this.heightInput.type = "number";
        this.heightInput.value = this.height.toString();
        this.heightInput.onchange = () => {
            this.height = parseInt(this.heightInput.value);
            this.resizeStage();
        };
        this.heightDiv.appendChild(this.heightInput);
        controlPanel.appendChild(this.heightDiv);

        this.widthDiv = document.createElement("div");

        const widthLabel = document.createElement("label");
        widthLabel.textContent = "幅:";
        this.widthDiv.appendChild(widthLabel);

        this.widthInput = document.createElement("input");
        this.widthInput.type = "number";
        this.widthInput.value = this.width.toString();
        this.widthInput.onchange = () => {
            this.width = parseInt(this.widthInput.value);
            this.resizeStage();
        };
        this.widthDiv.appendChild(this.widthInput);
        controlPanel.appendChild(this.widthDiv);

        app.appendChild(controlPanel);
    }
}
function findFirstZero(grid: Grid, start: Position): Position | null {
    for (let y = start.y; y < grid.length; y++) {
        for (let x = y === start.y ? start.x : 0; x < grid[y].length; x++) {
            if (grid[y][x] === null) {
                return { x, y };
            }
        }
    }
    return null;
}

function findNearestZeroBFS(grid: Grid, start: Position): Position | null {
    const rows = grid.length;
    if (rows === 0) return null; // グリッドなし
    const cols = grid[0].length;

    // バリテーション
    if (start.y < 0 || start.y >= rows || start.x < 0 || start.x >= cols) {
        console.warn("Out of grid.");
        return null; // 入力がおかしい
    }

    const startX = Math.floor(start.y);
    const startY = Math.floor(start.x);

    if (grid[startX][startY] == null) {
        return { x: startY, y: startX }; // ポジション開始時が行けそうだったら
    }

    const queue: Position[] = [{ x: startY, y: startX }];
    const visited: boolean[][] = Array(rows)
        .fill(null)
        .map(() => Array(cols).fill(false));
    visited[startX][startY] = true;

    const directions: Position[] = [
        { x: 1, y: 0 }, // 上
        { x: -1, y: 0 }, // 下
        { x: 0, y: 1 }, // 右
        { x: 0, y: -1 }, // 左
    ];

    while (queue.length > 0) {
        const current = queue.shift()!;

        for (const dir of directions) {
            const nextX = current.y + dir.y;
            const nextY = current.x + dir.x;

            // チェックして次
            if (
                nextX >= 0 &&
                nextX < rows &&
                nextY >= 0 &&
                nextY < cols &&
                !visited[nextX][nextY]
            ) {
                if (grid[nextX][nextY] == null) {
                    return { x: nextY, y: nextX };
                }
                queue.push({ x: nextY, y: nextX });
                visited[nextX][nextY] = true;
            }
        }
    }

    return null; // 何の成果も得られませんでした！
}

function findMinRectangle(
    array: Grid
): { x: number; y: number; height: number; width: number } | null {
    if (!array || array.length === 0 || array[0].length === 0) {
        return null; // 空の配列の場合は null を返す
    }

    const onePositions: { row: number; col: number }[] = [];
    for (let row = 0; row < array.length; row++) {
        for (let col = 0; col < array[row].length; col++) {
            if (array[row][col] !== null) {
                onePositions.push({ row, col });
            }
        }
    }

    if (onePositions.length === 0) {
        return null; // 1 が一つもない場合は null を返す
    }

    let minRow = Infinity;
    let maxRow = -Infinity;
    let minCol = Infinity;
    let maxCol = -Infinity;

    for (const pos of onePositions) {
        minRow = Math.min(minRow, pos.row);
        maxRow = Math.max(maxRow, pos.row);
        minCol = Math.min(minCol, pos.col);
        maxCol = Math.max(maxCol, pos.col);
    }

    const x = minCol;
    const y = minRow;
    const height = maxRow - minRow + 1;
    const width = maxCol - minCol + 1;

    return { x, y, height, width };
}
