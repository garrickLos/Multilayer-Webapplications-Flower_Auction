import { useState } from 'react'

export default function Wpfw() {
    const names = ['veiling', 'Github', 'Wpfw']
    const [name, setName] = useState(0)

    return (
        <h1 onClick={() => setName((name + 1) % names.length)} style={{ cursor: 'pointer' }}>
            {names[name]}
        </h1>
    )
}
