const [name, setName] = useState<string>("");
const [category, setCategory] = useState<string>("");
const [amount, setAmount] = useState<number | "">("");
const [place, setPlace] = useState<string>("");
const [minimumPrice, setMinimumPrice] = useState<number | "">("");
const [startPrice, setStartPrice] = useState<number | "">("");
const [startDate, setStartDate] = useState<string>("");
const [endDate, setEndDate] = useState<string>("");

const handleSubmit = () => {
    const verplichteVelden = [name, category, amount, place, minimumPrice, startPrice, startDate, endDate];
    if (!validateProduct(verplichteVelden)) {
        alert("Een of meer velden zijn leeg!");
    } else {
        alert("Product is succesvol opgeslagen");
    }
};
export function validateProduct(fields: string[]): boolean {
    return !fields.some(field => !field || field.trim() === "");
}
