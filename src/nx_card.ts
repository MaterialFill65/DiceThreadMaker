import "./nx_card.css";

export type CardMeta = {
    name: string;
    num: number;
    background: string;
    font?: number;
    main_img: string;
};

class Position {
    private _x!: number
    private _y!: number
    private observer?: (x: number, y: number) => void

    constructor(x: number, y: number, observer?: (x: number, y: number) => void) {
        this.observer = observer
        this.set(x, y)
    }
    get x() {
        return this._x
    }
    get y() {
        return this._y
    }

    set(x: number, y: number) {
        if (this.observer) {
            this.observer(x, y)
        }
        this._x = x
        this._y = y
    }
}

function createCloneElement() {
    const clone = document.createElement("div");
    const clone_inner = document.createElement("div");
    clone.classList.add("card");
    clone.classList.add("card-clone");
    clone_inner.classList.add("card-inner");
    clone.style.zIndex = "2";
    clone.style.pointerEvents = "none";
    clone.appendChild(clone_inner);
    clone.style.borderRadius =
        "calc(var(--card-inner-size) + var(--card-padding))";

    return clone;
}

export class Card {
    private meta: CardMeta
    readonly position: Position
    private readonly parent: Grid
    private readonly numElement: HTMLHeadingElement;
    private readonly nameElement: HTMLHeadingElement;
    private readonly mainImgElement: HTMLImageElement;
    readonly cardElement: HTMLDivElement;
    private times: number[] = [];
    private longPressTimeout: number | null = null;
    private readonly LONG_PRESS_DURATION = 500; // 長押し判定の時間（ミリ秒）
    private isLongPressing = false;
    private initialTouchPosition = { x: 0, y: 0 };
    private numberVisible: boolean = true;

    constructor(meta: CardMeta, x: number, y: number, grid: Grid) {
        this.meta = meta
        this.parent = grid

        this.numElement = document.createElement("h2");
        this.numElement.id = "num";
        this.num = this.num;

        this.nameElement = document.createElement("h1");
        this.nameElement.id = "name";
        this.name = this.name;
        this.font = this.font;

        const charDisplayElement = document.createElement("div");
        charDisplayElement.classList.add("card-charDisplay");
        charDisplayElement.appendChild(this.nameElement);
        charDisplayElement.appendChild(this.numElement);

        this.mainImgElement = document.createElement("img");
        this.main_img = this.main_img;

        this.cardElement = document.createElement("div");
        this.cardElement.classList.add("card");
        this.background = this.background;
        this.cardElement.style.zIndex = "1";
        this.cardElement.appendChild(this.mainImgElement);
        this.cardElement.appendChild(charDisplayElement);

        this.cardElement.addEventListener("contextmenu", this.handleContextMenu.bind(this));
        this.cardElement.addEventListener("pointerdown", this.pointerDown.bind(this));
        this.cardElement.addEventListener("pointerup", this.handlePointerUp.bind(this));
        this.cardElement.addEventListener("pointermove", this.handlePointerMove.bind(this));
        this.cardElement.addEventListener("pointercancel", this.cancelLongPress.bind(this));
        this.parent.stage.appendChild(this.cardElement);
        
        this.position = new Position(x, y, this.observe_pos.bind(this));
    }

    private handleContextMenu(ev: MouseEvent) {
        ev.preventDefault();
        if (Object.keys(this.parent.cardPointers).length > 0) return;
        this.createContextMenu(ev.pageX, ev.pageY);
    }

    private createContextMenu(x: number, y: number) {
        const menu = document.createElement("div");
        menu.className = "context-menu";
        
        const editItem = document.createElement("div");
        editItem.className = "context-menu-item";
        editItem.textContent = "編集";
        editItem.onclick = () => {
            this.openEditModal();
            menu.remove();
        };
        menu.appendChild(editItem);

        const deleteItem = document.createElement("div");
        deleteItem.className = "context-menu-item";
        deleteItem.textContent = "削除";
        deleteItem.style.color = "red";
        deleteItem.onclick = () => {
            this.destroy();
            this.parent.grid[this.position.y][this.position.x] = null;
            this.parent.reload();
            menu.remove();
        };
        menu.appendChild(deleteItem);

        document.body.appendChild(menu);
        menu.style.display = "flex";
        menu.style.left = `${x}px`;
        menu.style.top = `${y}px`;

        const closeMenu = (e: PointerEvent) => {
            if (!menu.contains(e.target as Node)) {
                menu.remove();
                document.body.removeEventListener("pointerdown", closeMenu);
            }
        };
        document.body.addEventListener("pointerdown", closeMenu);
    }

    private openEditModal() {
        const modal = document.createElement("div");
        modal.className = "edit-modal";

        const content = document.createElement("div");
        content.className = "edit-modal-content";
        
        const form = this.createEditForm(modal);
        content.appendChild(form);
        modal.appendChild(content);
        document.body.appendChild(modal);
        modal.style.display = "flex";
    }

    private createEditForm(modal: HTMLDivElement) {
        const form = document.createElement("form");
        form.className = "edit-form";

        // 名前入力
        const nameLabel = document.createElement("label");
        nameLabel.textContent = "名前:";
        const nameInput = document.createElement("input");
        nameInput.value = this.meta.name;
        form.appendChild(nameLabel);
        form.appendChild(nameInput);

        // フォントサイズ入力
        const fontLabel = document.createElement("label");
        fontLabel.textContent = "文字サイズ:";
        const fontInput = document.createElement("input");
        fontInput.type = "number";
        fontInput.value = this.font.toString();
        form.appendChild(fontLabel);
        form.appendChild(fontInput);

        // 背景色入力
        const bgLabel = document.createElement("label");
        bgLabel.textContent = "背景色:";
        const bgInput = document.createElement("input");
        bgInput.type = "color";
        bgInput.value = this.background;
        form.appendChild(bgLabel);
        form.appendChild(bgInput);

        // 画像URL入力
        const imgContainer = document.createElement("div");
        imgContainer.style.display = "flex";
        imgContainer.style.gap = "10px";
        imgContainer.style.alignItems = "center";
        
        const imgLabel = document.createElement("label");
        imgLabel.textContent = "画像URL:";
        const imgInput = document.createElement("input");
        imgInput.value = this.main_img;
        let dataURL = "";
        
        const uploadButton = document.createElement("button");
        uploadButton.type = "button";
        uploadButton.textContent = "↑";
        uploadButton.onclick = () => {
            const fileInput = document.createElement("input");
            fileInput.type = "file";
            fileInput.accept = "image/*";
            fileInput.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                const dataUrl = e.target?.result as string;
                // ファイル名をinputに設定
                imgInput.value = file.name;
                // 実際の画像データはカードのmain_imgに直接設定
                    dataURL = dataUrl;
                };
                reader.readAsDataURL(file);
            }
            };
            fileInput.click();
        };

        imgContainer.appendChild(imgLabel);
        imgContainer.appendChild(imgInput);
        imgContainer.appendChild(uploadButton);
        form.appendChild(imgContainer);

        // 数字表示トグル
        const numberVisibilityLabel = document.createElement("label");
        numberVisibilityLabel.textContent = "数字を表示:";
        const numberVisibilityInput = document.createElement("input");
        numberVisibilityInput.type = "checkbox";
        numberVisibilityInput.checked = this.numberVisible;
        numberVisibilityInput.classList.add("numberVisible")
        form.appendChild(numberVisibilityLabel);
        form.appendChild(numberVisibilityInput);

        // ボタンコンテナ
        const buttonContainer = document.createElement("div");
        buttonContainer.className = "button-container";

        const saveButton = document.createElement("button");
        saveButton.textContent = "保存";
        saveButton.type = "button";
        saveButton.onclick = () => {
            this.name = nameInput.value;
            this.font = Number(fontInput.value);
            this.background = bgInput.value;
            if (this.main_img !== imgInput.value){
                this.main_img = imgInput.value;
            }
            if (dataURL){
                this.mainImgElement.src = dataURL;
            }
            this.setNumberVisibility(numberVisibilityInput.checked);
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
        return form;
    }

    private pointerDown(ev: PointerEvent) {
        if (ev.button === 2) return;
        if (ev.ctrlKey) {
            console.info("クリックされましたが、Ctrlキーが押されています。無視します。")
            return;
        }
        this.times.forEach(val => clearInterval(val));

        // タッチデバイスの場合は長押し検出を開始
        if (ev.pointerType === 'touch') {
            this.isLongPressing = false;
            this.initialTouchPosition = { x: ev.clientX, y: ev.clientY };
            this.longPressTimeout = setTimeout(() => {
                this.isLongPressing = true;
                this.createContextMenu(ev.pageX, ev.pageY);
            }, this.LONG_PRESS_DURATION);
        }

        // 先にポインターキャッシュに登録
        this.parent.pointerCache[ev.pointerId] = {
            ev,
            shift: new Position(ev.pageX - this.parent.translates.x, ev.pageY - this.parent.translates.y)
        };

        if (Object.values(this.parent.pointerCache).length >= 2) {
            this.cancelLongPress();
            this.returnToOriginalPosition();
            return;
        }

        if (ev.pointerType !== 'touch') {
            this.startDragging(ev);
        }
    }

    private handlePointerMove(ev: PointerEvent) {
        if (this.longPressTimeout && ev.pointerType === 'touch') {
            // 一定以上移動したら長押しをキャンセル
            const moveThreshold = 10;
            const deltaX = Math.abs(ev.clientX - this.initialTouchPosition.x);
            const deltaY = Math.abs(ev.clientY - this.initialTouchPosition.y);
            
            if (deltaX > moveThreshold || deltaY > moveThreshold) {
                this.cancelLongPress();
                this.startDragging(ev);
            }
        }
    }

    private handlePointerUp(ev: PointerEvent) {
        if (ev.pointerType === 'touch') {
            if (!this.isLongPressing) {
                this.cancelLongPress();
            }
        }
    }

    private cancelLongPress() {
        if (this.longPressTimeout) {
            clearTimeout(this.longPressTimeout);
            this.longPressTimeout = null;
        }
        this.isLongPressing = false;
    }

    private startDragging(ev: PointerEvent) {
        const pos = this.cardElement.getBoundingClientRect();
        const shiftX = (ev.pageX - pos.left) / this.parent.scale;
        const shiftY = (ev.pageY - pos.top) / this.parent.scale;

        const clone = createCloneElement();
        this.cardElement.style.zIndex = "2000";
        this.cardElement.style.transitionDuration = "";
        this.cardElement.style.transition = "border-radius 0.3s";
        this.cardElement.style.borderRadius = "20px";

        this.parent.cardPointers[ev.pointerId] = {
            clone,
            shift: new Position(shiftX, shiftY),
            card: this,
            target_pos: new Position(this.position.x, this.position.y),
            ev
        };

        this.parent.stage.appendChild(clone);
        clone.style.transform = `translate(${this.position.x * pos.width / this.parent.scale}px, ${this.position.y * pos.height / this.parent.scale}px)`;

        this.parent.dragging(ev);
    }

    returnToOriginalPosition() {
        this.cardElement.style.transition = "transform 0.3s";
        this.cardElement.style.transform = `translate(${this.position.x * this.parent.oneblock.width}px, ${this.position.y * this.parent.oneblock.height}px)`;
        
        setTimeout(() => {
            this.cardElement.style.transition = "";
            this.cardElement.style.borderRadius = "";
            this.cardElement.style.zIndex = "1";
        }, 300);
    }

    private observe_pos(x: number, y: number) {
        if (this.position && this.parent.grid[this.position.y][this.position.x] === this) {
            this.parent.grid[this.position.y][this.position.x] = null;
        }
        this.times.forEach(e=>clearInterval(e))
        this.times = []
        this.parent.grid[y][x] = this;

        this.cardElement.style.transition = "";
        this.cardElement.style.transitionDuration = "0.3s";
        this.cardElement.style.transform = `translate(${x * this.parent.oneblock.width}px, ${y * this.parent.oneblock.height}px)`;
        
        {
            const func = () => {
                this.cardElement.style.borderRadius = "";
                this.cardElement.style.zIndex = "1";
            };
            const id = setTimeout(func, 300);
            this.times.push(id);
        }
        {
            const func = () => {
                this.cardElement.style.transitionDuration = "";
                this.times = [];
            };
            const id = setTimeout(func, 600);
            this.times.push(id);
        }
    }

    get num() {
        return this.meta.num;
    }
    set num(x: number) {
        this.meta.num = x;
        this.numElement.textContent = x.toString();
    }
    get name() {
        return this.meta.name;
    }
    set name(name: string) {
        this.meta.name = name;
        this.nameElement.innerHTML = `<div>${name}　</div>`; // TODO: もっといい方法を考える
    }
    get background() {
        return this.meta.background;
    }
    set background(code: string) {
        this.meta.background = code;
        this.cardElement.style.background = code;
    }
    get main_img() {
        return this.meta.main_img;
    }
    set main_img(url: string) {
        this.meta.main_img = url;
        this.mainImgElement.src = url;
    }
    get font() {
        return this.meta.font ?? 60;
    }
    set font(fontSize: number) {
        this.meta.font = fontSize;
        this.nameElement.style.fontSize = `${fontSize}px`;
    }

    public setNumberVisibility(visible: boolean) {
        this.numberVisible = visible;
        const numElement = this.cardElement.querySelector('#num') as HTMLElement;
        if (numElement) {
            numElement.style.visibility = visible ? 'visible' : 'hidden';
        }
    }

    public getNumberVisibility(): boolean {
        return this.numberVisible;
    }

    destroy() {
        this.cardElement.remove()
    }
}

type GridType = (Card | null)[][];

type pointerMeta = {
    shift: Position;
    card: Card;
    clone: HTMLDivElement;
    target_pos: Position;
    ev: PointerEvent;
};

export class Grid {
    readonly grid: GridType = [[null]];
    readonly oneblock = {
        width: 316 as const,
        height: 166 as const
    }
    readonly cardPointers: { [id: number]: pointerMeta | null } = {};
    readonly stage: HTMLDivElement;
    readonly translates: Position
    readonly pointerCache: { [id: number]: { shift: Position, ev: PointerEvent } } = {};
    public scale: number = 1;
    readonly app: HTMLDivElement;

    constructor(app: HTMLDivElement) {
        this.app = app
        this.stage = document.createElement("div");
        this.stage.classList.add("stage");
        this.translates = new Position(10, 200, (x, y)=>{
            app.style.top = `${y}px`;
            app.style.left = `${x}px`;
        });

        document.body.addEventListener("pointermove", this.dragging.bind(this));
        document.body.addEventListener("pointerup", this.pointerend.bind(this));
        document.body.addEventListener("pointerleave", this.pointerend.bind(this));
        app.appendChild(this.stage)

        document.body.addEventListener("wheel", (ev) => {
            if (ev.ctrlKey) {
                ev.preventDefault();
            }
            const target = ev.target as HTMLElement;
            if (!Array.from(this.stage.children).some((child) => child.contains(target)) && target !== document.body && target !== this.app) {
                return;
            }
           
            const scaleAmount = -ev.deltaY * 0.001;
            const x = ev.clientX
            const y = ev.clientY
            this.zoom(scaleAmount, x, y);
        }, { passive: false })
        document.body.addEventListener("pointerdown", (ev) => {
            const target = ev.target as HTMLElement;
            if (!Array.from(this.stage.children).some((child) => child.contains(target)) && target !== document.body && target !== this.app && target !== this.stage) {
                return;
            }
            this.pointerCache[ev.pointerId] = {
                ev,
                shift: new Position(ev.pageX - this.translates.x, ev.pageY - this.translates.y)
            };
        });

        let prevDiff = 0;
        let lastCenterX = 0;
        let lastCenterY = 0;

        const out = (ev: PointerEvent) => {
            delete this.pointerCache[ev.pointerId]
            const cache = Object.values(this.pointerCache)
            if (cache.length === 0){
                lastCenterX = 0;
                lastCenterY = 0;
            }
            prevDiff = 0;
        }

        document.body.addEventListener("pointerup", out);
        document.body.addEventListener("pointerleave", out);

        document.body.addEventListener("pointermove", (ev) => {
            const cache = Object.values(this.pointerCache);
            
            // 2本指検出時の処理
            if (cache.length === 2) {
                // ドラッグ中のカードがあれば元の位置に戻す
                Object.values(this.cardPointers).forEach(pointer => {
                    if (pointer) {
                        pointer.card.returnToOriginalPosition();
                        pointer.clone.remove();
                        delete this.cardPointers[pointer.ev.pointerId];
                    }
                });

                const x1 = cache[0].ev.clientX;
                const y1 = cache[0].ev.clientY;
                const x2 = cache[1].ev.clientX;
                const y2 = cache[1].ev.clientY;
                
                const curDiff = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
                const centerX = (x1 + x2) / 2;
                const centerY = (y1 + y2) / 2;

                if (prevDiff > 0) {
                    // 移動量の計算
                    const moveX = centerX - lastCenterX;
                    const moveY = centerY - lastCenterY;
                    
                    // スケール変更の計算
                    const scaleDiff = (curDiff - prevDiff) / prevDiff;  // 相対的な変化量を計算
                    const scaleAmount = scaleDiff * this.scale;   // より滑らかな変化に
                    
                    this.zoom(scaleAmount, centerX, centerY);
                    
                    // 移動の適用（スケールに応じて移動量を調整）
                    const adjustedMoveX = moveX * (1 / this.scale);
                    const adjustedMoveY = moveY * (1 / this.scale);
                    this.move(
                        this.translates.x + adjustedMoveX,
                        this.translates.y + adjustedMoveY
                    );
                }

                prevDiff = curDiff;
                lastCenterX = centerX;
                lastCenterY = centerY;

                this.pointerCache[ev.pointerId] = { ...this.pointerCache[ev.pointerId], ev };
                return;
            }

            // 1本指の処理
            if (cache.length === 1) {
                this.pointerCache[ev.pointerId].ev = ev;
                if (lastCenterX && lastCenterY) {
                    return;
                }
                // カードのドラッグ中でなければ移動
                if (!Object.values(this.cardPointers).length) {
                    this.move(ev.clientX - this.pointerCache[ev.pointerId].shift.x, 
                            ev.clientY - this.pointerCache[ev.pointerId].shift.y);
                }
                return;
            }
        });
    }

    public zoom(scaleAmount: number, x: number, y: number){
        const prevScale = this.scale;
        this.scale += scaleAmount;
        this.scale = Math.min(Math.max(0.5, this.scale), 2);

        const out_x = (this.translates.x - x) * (this.scale / prevScale) + x;
        const out_y = (this.translates.y - y) * (this.scale / prevScale) + y;

        this.app.style.transform = `scale(${ this.scale })`;
        this.move(out_x, out_y);
    }

    public move(x: number, y: number){
        this.translates.set(x, y)
    }

    public dragging(ev: PointerEvent) {
        ev.preventDefault()
        if (!this.cardPointers[ev.pointerId] || Object.values(this.pointerCache).length >= 2) {
            return;
        }
        const { card, clone, shift, target_pos } = this.cardPointers[ev.pointerId]!;
        card.cardElement.style.transform = `translate(${ev.pageX / this.scale - this.translates.x / this.scale - shift.x}px, ${ev.pageY / this.scale - this.translates.y / this.scale - shift.y}px)`;
        const pos = card.cardElement.getBoundingClientRect();
        const { x, y } = this.find(
            (pos.left + pos.width / 2 - this.translates.x) / (pos.width),
            (pos.top + pos.height / 2 - this.translates.y) / (pos.height)
        );
        if(target_pos.x !== x || target_pos.y !== y){
            clone.style.transform = `translate(${x * pos.width / this.scale}px, ${y * pos.height / this.scale}px)`;
        }
        target_pos.set(x, y);
    }
    public pointerend(ev: PointerEvent) {
        if (!this.cardPointers[ev.pointerId] || Object.values(this.pointerCache).length >= 2) {
            return;
        }
        const { card, clone } = this.cardPointers[ev.pointerId]!;
        const pos = card.cardElement.getBoundingClientRect();

        const { x, y } = this.cardPointers[ev.pointerId]!.target_pos;
        clone.style.transform = `translate(${x * pos.width / this.scale}px, ${y * pos.height / this.scale}px)`;

        if (this.grid[y][x]) {
            const dest_card = this.grid[y][x]!

            dest_card.position.set(card.position.x, card.position.y);
        }
        card.position.set(x, y);
        this.reload();
        setTimeout(()=>{
            clone.remove()
        },300)
        delete this.cardPointers[ev.pointerId]
        delete this.pointerCache[ev.pointerId]
    }

    set height(x: number) {
        if (x < this.grid.length) {
            for (let i = x; i < this.grid.length; i++) {
                for (let j = 0; j < this.grid[i].length; j++) {
                    if (this.grid[i][j] !== null) {
                        this.grid[i][j]!.destroy();
                    }
                }
            }
            this.grid.length = x;
        } else {
            while (this.grid.length < x) {
                this.grid.push(new Array(this.width).fill(null));
            }
        }
        this.stage.style.height = `${this.oneblock.height * x}px`
    }
    get height() {
        return this.grid.length;
    }

    set width(x: number) {
        if (x < this.width) {
            for (let row of this.grid) {
                for (let i = x; i < row.length; i++) {
                    if (row[i] !== null) {
                        row[i]!.destroy();
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
        this.stage.style.width = `${this.oneblock.width * x}px`
    }
    get width() {
        return this.grid[0]!.length;
    }

    private find(x: number, y: number) {
        const normal_x = Math.min(Math.max(0, x), this.grid[0].length - 1); // 正規化
        const normal_y = Math.min(Math.max(0, y), this.grid.length - 1);
        return { x: Math.floor(normal_x), y: Math.floor(normal_y) };
    }

    private findFirstZero() {
        for (let y = 0; y < this.grid.length; y++) {
            for (let x = 0; x < this.grid[y].length; x++) {
                if (this.grid[y][x] === null) {
                    return { x, y };
                }
            }
        }
        return null;
    }

    public addCard(meta: CardMeta) {
        const deploy_pos = this.findFirstZero()
        if (!deploy_pos) {
            alert("カードがいっぱいです！どれか削除してください！")
            return
        }

        const { x, y } = deploy_pos;
        new Card(meta, x, y, this)
        this.reload()
    }
    public reload() {
        // 左上から番号振ってく
        let counter = 1;
        for (let y = 0; y < this.grid.length; y++) {
            for (let x = 0; x < this.grid[y].length; x++) {
                if (this.grid[y][x] !== null) {
                    this.grid[y][x]!.num = counter++;
                }
            }
        }
    }
}