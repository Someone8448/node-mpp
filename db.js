module.exports = (file, defaults) => {
    var data = {};
    data.data = null;
    data.read = () => {
        try {
            data.data = JSON.parse(require("fs").readFileSync(file, "utf8"));
        } catch (error) {
            data.data = defaults === undefined ? {} : defaults;
        }
    };
    data.write = () => {
        require("fs").writeFileSync(file, JSON.stringify(data.data));
    };
    data.read();
    data.write();
    return data;
};
