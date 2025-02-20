import './nx_app.css';
import { CardMeta, Grid } from './nx_card';
import { domToPng } from 'modern-screenshot'

export class App {
    private readonly app: HTMLDivElement;
    private readonly grid: Grid;
    private readonly data: CardMeta[];
    private numberVisible: boolean = true;

    constructor(app: HTMLDivElement) {
        this.app = app;
        this.grid = new Grid(app);
        this.data = this.initializeData();

        // 初期グリッドサイズ設定
        this.grid.height = 9;
        this.grid.width = 3;
        
        this.createControlPanel();
        this.createAddButton();
        this.createHamburgerMenu();
        this.setupResizeHandler();
        
        // 初期カードの配置
        this.data.forEach(datum => {
            this.grid.addCard(datum);
        });
    }

    private createControlPanel() {
        const controlPanel = document.createElement("div");
        controlPanel.className = "control-panel";

        // 高さコントロール
        const heightDiv = document.createElement("div");
        const heightLabel = document.createElement("label");
        heightLabel.textContent = "高さ:";
        const heightInput = document.createElement("input");
        heightInput.type = "number";
        heightInput.value = this.grid.height.toString();
        heightInput.onchange = () => {
            this.grid.height = parseInt(heightInput.value);
        };
        heightDiv.appendChild(heightLabel);
        heightDiv.appendChild(heightInput);
        controlPanel.appendChild(heightDiv);

        // 幅コントロール
        const widthDiv = document.createElement("div");
        const widthLabel = document.createElement("label");
        widthLabel.textContent = "幅:";
        const widthInput = document.createElement("input");
        widthInput.type = "number";
        widthInput.value = this.grid.width.toString();
        widthInput.onchange = () => {
            this.grid.width = parseInt(widthInput.value);
        };
        widthDiv.appendChild(widthLabel);
        widthDiv.appendChild(widthInput);
        controlPanel.appendChild(widthDiv);

        this.app.appendChild(controlPanel);
    }

    private createHamburgerMenu() {
        const hamburgerMenu = document.createElement('div');
        hamburgerMenu.className = 'hamburger-menu';
        hamburgerMenu.innerHTML = '<div></div><div></div><div></div>';
        
        const menu = document.createElement('div');
        menu.className = 'menu';

        // クリアボタン
        const clearItem = document.createElement('div');
        clearItem.className = 'menu-item';
        clearItem.textContent = 'すべてのカードを消す';
        clearItem.style.color = "red";
        clearItem.onclick = () => this.clearAllCards();
        menu.appendChild(clearItem);

        // 数字表示切替ボタン
        const toggleNumbersItem = document.createElement('div');
        toggleNumbersItem.className = 'menu-item';
        toggleNumbersItem.textContent = this.numberVisible ? '数字を消す' : '数字を表示';
        toggleNumbersItem.onclick = () => {
            this.toggleNumbers(!this.numberVisible);
            toggleNumbersItem.textContent = this.numberVisible ? '数字を消す' : '数字を表示';
        };
        menu.appendChild(toggleNumbersItem);

        // 品質バー
        const qualityItem = document.createElement('div');
        qualityItem.className = 'menu-item';

        const qualityLabel = document.createElement('label');
        qualityLabel.textContent = '品質: ';
        const scaleInput = document.createElement('input');
        scaleInput.type = 'range';
        scaleInput.min = '1';
        scaleInput.max = '3';
        scaleInput.step = '0.5';
        scaleInput.value = '1';
        
        const scaleValue = document.createElement('span');
        scaleValue.textContent = '1x';
        scaleInput.oninput = () => {
            scaleValue.textContent = `${scaleInput.value}x`;
        };
        qualityItem.appendChild(qualityLabel);
        qualityItem.appendChild(scaleInput);
        qualityItem.appendChild(scaleValue);
        menu.appendChild(qualityItem);
        
        // エクスポートボタン
        const exportItem = document.createElement('div');
        exportItem.className = 'menu-item';

        const exportButton = document.createElement('button');
        exportButton.textContent = '画像をエクスポート！';
        exportButton.className = 'export-button';
        exportButton.onclick = () => this.exportAsImage(Number(scaleInput.value));

        exportItem.appendChild(exportButton);
        menu.appendChild(exportItem);

        document.body.appendChild(hamburgerMenu);
        document.body.appendChild(menu);

        hamburgerMenu.onclick = () => {
            menu.style.display = menu.style.display === 'flex' ? 'none' : 'flex';
        };
    }

    private createAddButton() {
        const addButton = document.createElement('button');
        addButton.className = 'add-card-button';
        addButton.textContent = '+';
        addButton.style.zIndex = "10000";

        const cardList = document.createElement('div');
        cardList.className = 'card-list';
        
        this.data.forEach(datum => {
            const listItem = document.createElement('div');
            listItem.className = 'card-list-item';
            listItem.textContent = new DOMParser().parseFromString(datum.name, "text/html").body.textContent;
            listItem.onclick = () => this.grid.addCard(datum);
            cardList.appendChild(listItem);
        });

        addButton.onclick = () => {
            cardList.style.display = cardList.style.display === 'flex' ? 'none' : 'flex';
        };

        document.body.appendChild(addButton);
        document.body.appendChild(cardList);
    }

    private async exportAsImage(scale: number) {
        try {
            this.grid.stage.style.boxShadow = "none";
            this.grid.stage.style.transform = ""
            const stageElement = this.grid.stage.cloneNode(true) as HTMLElement;
            stageElement.style.opacity = "0";
            stageElement.style.transform = `scale(${scale})`;
            stageElement.style.transformOrigin = "1px 0px";

            document.body.appendChild(stageElement);

            const png = await domToPng(stageElement, {
                features: {
                    fixSvgXmlDecode: true
                },
                style:{
                    opacity: "1",
                }
            });
            
            const link = document.createElement('a');
            link.href = png;
            link.download = 'cards.png';
            link.click();

            stageElement.remove();
        } catch (e) {
            console.warn(e);
            alert("画像の作成に失敗しました。");
        } finally {
            this.grid.stage.style.boxShadow = "";
        }
    }

    private clearAllCards() {
        if (confirm("本当にすべてのカードを消しますか?")) {
            this.grid.grid.forEach((col, y) => {
                col.forEach((card, x) => {
                    if (card) {
                        card.destroy();
                        this.grid.grid[y][x] = null;
                    }
                });
            });
        }
    }

    private toggleNumbers(show: boolean) {
        this.numberVisible = show;
        this.grid.grid.forEach(row => {
            row.forEach(card => {
                if (card) {
                    card.setNumberVisibility(show);
                }
            });
        });
    }

    private setupResizeHandler() {
        const resizeHandler = () => {
            document.body.style.width = `${window.innerWidth}px`;
            document.body.style.height = `${window.innerHeight}px`;
        };
        window.addEventListener('resize', resizeHandler);
        resizeHandler(); // 初期サイズ設定
    }

    private initializeData(): CardMeta[] {
        return [
            {
                name: "咲季",
                num: 1,
                background: "#f78b8b",
                main_img: "./saki.png"
            },
            {
                name: "手毬",
                num: 2,
                background: "#cae2fa",
                main_img: "./temari.png"
            },
            {
                name: "ことね",
                num: 3,
                background: "#f6fa82",
                main_img: "./kotone.png"
            },
            {
                name: "麻央",
                num: 4,
                background: "#f68be9",
                main_img: "./mao.png"
            },
            {
                name: "リーリヤ",
                num: 5,
                background: "#edfdff",
                main_img: "./lilja.png",
                font: 45
            },
            {
                name: "千奈",
                num: 6,
                background: "#f9ad60",
                main_img: "./china.png"
            },
            {
                name: "清夏",
                num: 7,
                background: "#a3fd4b",
                main_img: "./sumika.png"
            },

            {
                name: "広",
                num: 8,
                background: "#4bc7db",
                main_img: "./hiro.png"
            },
            {
                name: "莉波",
                num: 9,
                background: "#f8c2d4",
                main_img: "./rinami.png"
            },
            {
                name: "佑芽",
                num: 10,
                background: "#f08472",
                main_img: "./ume.png"
            },
            {
                name: "美鈴",
                num: 11,
                background: "#9fb5dc",
                main_img: "./misuzu.png"
            },
            {
                name: "星南",
                num: 12,
                background: "#f8c482",
                main_img: "./sena.png"
            },
            {
                name: "燕",
                num: 13,
                background: "#a194f3",
                main_img: "./tsubame.png"
            },
            {
                name: "あさり",
                num: 14,
                background: "#a6e4c7",
                main_img: "./asari.png"
            },
            {
                name: "邦夫",
                num: 15,
                background: "#f6b445",
                main_img: "./kunio.png"
            },
            {
                name: "優",
                num: 16,
                background: "#9e9cf1",
                main_img: "./yuu.png"
            },
            {
                name: "燐羽",
                num: 17,
                background: "#7e6da3",
                main_img: "./rinnha.png"
            },
            {
                name: "撫子",
                num: 22,
                background: "#f9b3ff",
                main_img: "./nadeshiko.png"
            },
            {
                name: "四音",
                num: 22,
                background: "#e64e76",
                main_img: "./shion.png"
            },
            {
                name: "月花",
                num: 22,
                background: "#ad9178",
                main_img: "./gekka.png"
            },
            {
                name: "黒井",
                num: 18,
                background: "#fff",
                main_img: "./kuroi.png"
            },
            {
                name: "はつみ<font size='5'>ちゃん</font>",
                num: 19,
                background: "#f8c482",
                main_img: "./hatsumi.png",
                font: 50
            },
            {
                name: "Vo<font size='5'>トレーナー</font>",
                num: 20,
                background: "#f2178b",
                main_img: "./Vo.png",
                font: 50
            },
            {
                name: "Da<font size='5'>トレーナー</font>",
                num: 21,
                background: "#0899f7",
                main_img: "./Da.png",
                font: 50
            },
            {
                name: "Vi<font size='5'>トレーナー</font>",
                num: 22,
                background: "#feb209",
                main_img: "./Vi.png",
                font: 50
            },
            {
                name: "学P",
                num: 23,
                background: "#fff",
                main_img: "./producer.png"
            }
        ];
    }

    
}

// アプリケーションの初期化
const appElement = document.querySelector<HTMLDivElement>('#app');
if (appElement) {
    new App(appElement);
}