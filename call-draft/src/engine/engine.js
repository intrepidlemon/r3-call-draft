import { usePapaParse } from 'react-papaparse';
import preference from './preference.csv'

export default function Engine() {
    const { readString } = usePapaParse();

    fetch(preference)
        .then((r) => r.text())
        .then((textContent) => {
            console.log(readString(textContent));
        }
    );
}
