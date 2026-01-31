export const kConverter = (num) => {
    if (typeof num !== "number") return "0";

    if (num >= 1000) {
        return (num / 1000).toFixed(1) + "k";
    }

    return num.toString();
};
