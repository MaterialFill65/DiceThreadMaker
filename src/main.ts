import './style.css';
import { Card, cardGrid } from './card.ts';
import * as html_to_canvas from "html-to-image"
const app = document.querySelector<HTMLDivElement>('#app')!

const data: Card[] = [
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
]

const grid = new cardGrid(app)
grid.height = 9
grid.width = 3
grid.moveGrid(200,100)
app.appendChild(grid.stage)

const addButton = document.createElement('button');
addButton.className = 'add-card-button';
addButton.textContent = '+';
addButton.style.zIndex = "10000"
document.body.appendChild(addButton);

const cardList = document.createElement('div');
cardList.className = 'card-list';
const domparse = new DOMParser()
data.forEach(datum => {
    const listItem = document.createElement('div');
    listItem.className = 'card-list-item';
    listItem.textContent = domparse.parseFromString(datum.name, "text/html").body.textContent;
    listItem.onclick = () => {
        grid.addCard(datum);
    };
    cardList.appendChild(listItem);
});
document.body.appendChild(cardList);

addButton.onclick = () => {
    cardList.style.display = cardList.style.display === 'flex' ? 'none' : 'flex';
};

const hamburgerMenu = document.createElement('div');
hamburgerMenu.className = 'hamburger-menu';
hamburgerMenu.innerHTML = '<div></div><div></div><div></div>';
document.body.appendChild(hamburgerMenu);

const menu = document.createElement('div');
menu.className = 'menu';

const clearItem = document.createElement('div');
clearItem.className = 'menu-item';
clearItem.textContent = 'すべてのカードを消す';
clearItem.style.color = "red"
clearItem.onclick = () => {
    if(confirm("本当にすべてのカードを消しますか?")){
        grid.grid.forEach((col, y)=>{
            col.forEach((card, x)=>{
                if(card){
                    card.card.remove()
                    grid.grid[y][x] = null
                }
            })
        });
    }
};
menu.appendChild(clearItem);

document.body.appendChild(menu);

hamburgerMenu.onclick = () => {
    menu.style.display = menu.style.display === 'flex' ? 'none' : 'flex';
};

data.forEach(datum => {
    grid.addCard(datum);
});

function exportCardsAsImage() {
    grid.resizeStage()
    grid.stage.style.boxShadow = "none";
    grid.stage.style.transform = "";
    html_to_canvas.toPng(grid.stage, { skipAutoScale: true }).then(png => {
        const link = document.createElement('a');
        console.log(png)
        link.href = png;
        link.download = 'cards.png';
        grid.stage.style.boxShadow = "";
        grid.stage.style.transform = `translate(${grid.translates.x}px, ${grid.translates.y}px)`;
        link.click();
    }).catch(e=>{
        console.warn(e);
        grid.stage.style.boxShadow = "";
        grid.stage.style.transform = `translate(${grid.translates.x}px, ${grid.translates.y}px)`;
        alert("画像の作成に失敗しました。")
    });
}

const exportButton = document.createElement('button');
exportButton.className = 'export-button';
exportButton.textContent = '画像をエクスポート！';
exportButton.onclick = exportCardsAsImage;
menu.appendChild(exportButton);

document.body.style.width = `${window.innerWidth}px`
document.body.style.height = `${window.innerHeight}px`
window.onresize = () =>{
    document.body.style.width = `${window.innerWidth}px`
    document.body.style.height = `${window.innerHeight}px`
}