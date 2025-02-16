import "./card.css";

export type Card = {
    name: string;
    font?: number;
    num: number;
    background: string;
    main_img: string;
};

type Position = { x: number; y: number };

type Meta = {
    card: HTMLDivElement;
    position?: number;
    data: Card;
    times: number[];
};

type pointerMeta = {
    elements: { card: HTMLDivElement; clone: HTMLDivElement };
    shift: Position;
    meta: Meta;
    target_pos?: Position;
};

type Row = Meta[];

function createCardElement(data: Card) {
    const nameElement = document.createElement("h1");
    nameElement.id = "name";
    nameElement.textContent = data.name;
    const numElement = document.createElement("h2");
    numElement.id = "num";
    numElement.textContent = data.num.toString();
    numElement.style.fontSize = `${data.font ?? 60}px`;
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

export class cardRow {
    private pointers: { [id: number]: pointerMeta | null } = {};
    public row: Row = [];
    public stage: HTMLDivElement = document.createElement("div");
    public outline: HTMLDivElement = document.createElement("div");
    public translates: Position = {
        x: 0,
        y: 0,
    };
    private _width: number = 0

    set width(x: number){
        this._width = x
    }
    get width() {
        return this._width
    }

    private startDrag(ev: PointerEvent, meta: Meta) {
        if (meta.position) {
            const original_meta = this.row[meta.position]
            if (original_meta) {
                original_meta.times.forEach((timer_id) => {
                    clearTimeout(timer_id);
                });
                original_meta.times = [];
            }
        }
        const pos = meta.card.getBoundingClientRect();

        const shiftX = ev.clientX - pos.left;
        const shiftY = ev.clientY - pos.top;

        meta.card.style.zIndex = "2000";
        const clone = createCloneElement();
        clone.style.transform = `translate(${ev.pageX - shiftX
            }px, ${ev.pageY - shiftY
            }px)`;
        meta.card.style.transition = "border-radius 0.3s";
        meta.card.style.borderRadius =
            "calc(var(--card-inner-size) + var(--card-padding))";
        this.pointers[ev.pointerId] = {
            elements: { card: meta.card, clone },
            shift: { x: shiftX, y: shiftY },
            meta
        };
    }

    private dragging(ev: PointerEvent) {
        if (!this.pointers[ev.pointerId]) {
            return;
        }
        const { meta, elements, shift } = this.pointers[ev.pointerId]!;

        elements.card.style.transform = `translate(${ev.pageX - this.translates.x - shift.x}px, ${ev.pageY - this.translates.y - shift.y
            }px)`;

        const pos = elements.card.getBoundingClientRect();
        const x = Math.floor((pos.x - this.translates.x + pos.width / 2) / pos.width)
        const y = Math.floor((pos.y - this.translates.y + pos.height / 2) / pos.height)
        const position = (y * this.width) + x;
        const old_position = this.row.findIndex(val => val === meta)
        this.row = moveAt(this.row, old_position, position)

        this.pointers[ev.pointerId]!.target_pos = { x, y };

        elements.clone.style.transform = `translate(${x * pos.width}px, ${y * pos.height
            }px)`;
    }

    private stopDrag(ev: PointerEvent) {
        if (!this.pointers[ev.pointerId]) {
            return;
        }
        this.dragging(ev);
        const { elements, shift, meta } = this.pointers[ev.pointerId]!;
    }

    private recalcPos(){

    }

}

function moveAt(array: Row, index: number, at: number) {
    if (index === at || index > array.length - 1 || at > array.length - 1) {
        return array;
    }

    const value = array[index];
    const tail = array.slice(index + 1);

    array.splice(index);

    Array.prototype.push.apply(array, tail);

    array.splice(at, 0, value);

    return array;
}
