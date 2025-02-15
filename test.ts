function findSmallestSquare(array: (0 | 1)[][]): { x: number, y: number, height: number, width: number } | null {
    const onePositions: { row: number, col: number }[] = [];

    // 1の位置を特定
    for (let row = 0; row < array.length; row++) {
        for (let col = 0; col < array[row].length; col++) {
            if (array[row][col] === 1) {
                onePositions.push({ row, col });
            }
        }
    }

    // 1が存在しない場合
    if (onePositions.length === 0) {
        return { x: 0, y: 0, height: 1, width: 1 }; // 1x1の正方形を返す (必要に応じて調整)
    }

    // 外接矩形を計算
    let minRow = onePositions[0].row;
    let maxRow = onePositions[0].row;
    let minCol = onePositions[0].col;
    let maxCol = onePositions[0].col;

    for (const pos of onePositions) {
        minRow = Math.min(minRow, pos.row);
        maxRow = Math.max(maxRow, pos.row);
        minCol = Math.min(minCol, pos.col);
        maxCol = Math.max(maxCol, pos.col);
    }

    const rectHeight = maxRow - minRow + 1;
    const rectWidth = maxCol - minCol + 1;
    const sideLength = Math.max(rectHeight, rectWidth);

    return {
        x: minCol,
        y: minRow,
        height: sideLength,
        width: sideLength
    };
}

// 使用例
const array2d: (0 | 1)[][] = [
    [0, 0, 0, 0, 0],
    [0, 1, 0, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 0, 1, 0],
    [0, 0, 0, 0, 0]
];

const result = findSmallestSquare(array2d);
if (result) {
    console.log(result); // 出力例: { x: 1, y: 1, height: 3, width: 3 }
}

const array2d_no_ones: (0 | 1)[][] = [
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0]
];

const result_no_ones = findSmallestSquare(array2d_no_ones);
if (result_no_ones) {
    console.log(result_no_ones); // 出力例: { x: 0, y: 0, height: 1, width: 1 }
}