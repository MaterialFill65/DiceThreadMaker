import { ensureDir } from "https://deno.land/std@0.224.0/fs/mod.ts";
import { join, basename } from "https://deno.land/std@0.224.0/path/mod.ts";

interface ImageData {
    main_img: string;
    [key: string]: string | number;
}

async function downloadImage(url: string, savePath: string) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to download image: ${response.statusText}`);
    }

    await Deno.writeFile(savePath, await response.bytes());
}

async function saveImages(imageArray: ImageData[]) {
    const publicDir = join(Deno.cwd(), 'public');
    await ensureDir(publicDir);

    for (const imageData of imageArray) {
        if (imageData.main_img) {
            const imageUrl = imageData.main_img;
            
            const imageName = basename(imageUrl);
            const savePath = join(publicDir, imageUrl.split("/")[6] + ".png");
            await downloadImage(imageUrl, savePath);
            console.log(`Downloaded and saved: ${imageName}`);
        }
    }
}

// Example usage
const images: ImageData[] = [
    {
        name: "咲季",
        num: 1,
        background: "#f78b8b",
        main_img: "https://gakuen.idolmaster-official.jp/assets/img/idol/saki/default.png"
    },
    {
        name: "手毬",
        num: 2,
        background: "#cae2fa",
        main_img: "https://gakuen.idolmaster-official.jp/assets/img/idol/temari/default.png"
    },
    {
        name: "ことね",
        num: 3,
        background: "#f6fa82",
        main_img: "https://gakuen.idolmaster-official.jp/assets/img/idol/kotone/default.png"
    },
    {
        name: "麻央",
        num: 4,
        background: "#f68be9",
        main_img: "https://gakuen.idolmaster-official.jp/assets/img/idol/mao/default.png"
    },
    {
        name: "千奈",
        num: 6,
        background: "#f9ad60",
        main_img: "https://gakuen.idolmaster-official.jp/assets/img/idol/china/default.png"
    },
    {
        name: "清夏",
        num: 7,
        background: "#a3fd4b",
        main_img: "https://gakuen.idolmaster-official.jp/assets/img/idol/sumika/default.png"
    },
    {
        name: "リーリヤ",
        num: 5,
        background: "#edfdff",
        main_img: "https://gakuen.idolmaster-official.jp/assets/img/idol/lilja/default.png"
    },
    {
        name: "広",
        num: 8,
        background: "#4bc7db",
        main_img: "https://gakuen.idolmaster-official.jp/assets/img/idol/hiro/default.png"
    },
    {
        name: "莉波",
        num: 9,
        background: "#f8c2d4",
        main_img: "https://gakuen.idolmaster-official.jp/assets/img/idol/rinami/default.png"
    },
    {
        name: "佑芽",
        num: 10,
        background: "#f08472",
        main_img: "https://gakuen.idolmaster-official.jp/assets/img/idol/ume/default.png"
    },
    {
        name: "美鈴",
        num: 11,
        background: "#9fb5dc",
        main_img: "https://gakuen.idolmaster-official.jp/assets/img/idol/misuzu/default.png"
    },
    {
        name: "星南",
        num: 12,
        background: "#f8c482",
        main_img: "https://gakuen.idolmaster-official.jp/assets/img/idol/sena/default.png"
    },
    {
        name: "燕",
        num: 13,
        background: "#a194f3",
        main_img: "https://gakuen.idolmaster-official.jp/assets/img/idol/tsubame/default.png"
    },
    {
        name: "あさり",
        num: 14,
        background: "#a6e4c7",
        main_img: "https://gakuen.idolmaster-official.jp/assets/img/idol/asari/default.png"
    },
    {
        name: "邦夫",
        num: 15,
        background: "#f6b445",
        main_img: "https://gakuen.idolmaster-official.jp/assets/img/idol/kunio/default.png"
    }
]

saveImages(images).catch(console.error);