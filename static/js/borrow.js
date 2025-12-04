const token = localStorage.getItem("accessToken");

if (!token) {
    window.location.href = "/";
}

const BORROW_URL = "http://127.0.0.1:8000/api/borrowings/"; 

let allTransactions = [];


async function loadBorrowed(searchTerm = '') {

    const res = await fetch(BORROW_URL, {
        headers: { "Authorization": `Bearer ${token}` }
    });

    if (res.status === 401) {
        return window.location.href = "/";
    }

    allTransactions = await res.json();
    
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    let processedTransactions = allTransactions;

    if (lowerCaseSearchTerm) {
        processedTransactions = allTransactions.filter(tx => {
            const bookTitle = tx.book?.title.toLowerCase() || '';
            const borrowerName = tx.borrower?.name.toLowerCase() || '';
            
            return bookTitle.includes(lowerCaseSearchTerm) ||
                       borrowerName.includes(lowerCaseSearchTerm);
        });
    }

    renderTransactions(processedTransactions);
}

function calculateLiveFine(dateDueString) {
    if (!dateDueString) return 0;

    const dateDue = new Date(dateDueString);
    dateDue.setHours(0, 0, 0, 0);
    
    // const dateCurrent = new Date("2025-12-14"); 
    const dateCurrent = new Date();
    
    dateCurrent.setHours(0, 0, 0, 0);

    if (dateCurrent <= dateDue) {
        return 0;
    }
    const timeDifferenceMs = dateCurrent.getTime() - dateDue.getTime();
    const daysLate = Math.ceil(timeDifferenceMs / 86400000); 
    
    return daysLate * 30;
}

function renderTransactions(transactions) {
    const table = document.getElementById("borrowedTable");
    if (!table) return;
    table.innerHTML = "";

    transactions.forEach(tx => {
        let actionContent;
        let fineDisplay;

        if (tx.date_returned) {
            actionContent = '<span class="badge bg-success">Returned</span>';
            fineDisplay = tx.fine_amount;
        } else {
            actionContent = `<button class="btn btn-sm btn-success" onclick="returnBook(${tx.id})">Return</button>`;
            const liveFine = calculateLiveFine(tx.date_due);
            fineDisplay = liveFine.toFixed(2);
        }

        

        table.innerHTML += `
        <tr>
            <td>${tx.book ? tx.book.title : "N/A"}</td>
            <td>${tx.borrower ? tx.borrower.name : "N/A"}</td>
            <td>${tx.borrower ? (tx.borrower.contact || "N/A") : "N/A"}</td>
            <td>${tx.borrower ? (tx.borrower.email || "N/A") : "N/A"}</td>
            <td>${tx.borrower ? (tx.borrower.address || "N/A") : "N/A"}</td> 
            <td>${tx.date_borrowed ? new Date(tx.date_borrowed).toLocaleDateString() : ''}</td>
            <td>${tx.date_due ? new Date(tx.date_due).toLocaleDateString() : ''}</td>
            <td>${tx.date_returned ? new Date(tx.date_returned).toLocaleDateString() : 'Not returned'}</td>
            <td>${fineDisplay}</td>
            <td>${actionContent}</td>
        </tr>`;
            });

}


async function returnBook(id) {
    if (!confirm("Mark this book as returned?")) return;
    
    const csrfToken = getCookie('csrftoken');

    // const ADVANCE_DATE = "2025-12-14T00:00:00.000Z";

    const res = await fetch(`${BORROW_URL}${id}/`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
            "X-CSRFToken": csrfToken
        },
        // body: JSON.stringify({ date_returned: ADVANCE_DATE })
        body: JSON.stringify({ date_returned: new Date().toISOString()})  
    });

    if (!res.ok) {
        const err = await res.json();
        alert("Error: " + JSON.stringify(err));
        return;
    }
    window.location.reload();
}


function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.startsWith(name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}


document.addEventListener("DOMContentLoaded", () => {
    loadBorrowed();

    const searchInput = document.getElementById("searchInput");
    const searchButton = document.querySelector(".search-button");

    if (searchInput) {
        searchInput.addEventListener("keyup", (e) => {
            loadBorrowed(e.target.value);
        });
    }

    if (searchButton) {
        searchButton.addEventListener("click", () => {
            const searchTerm = searchInput?.value || '';
            loadBorrowed(searchTerm);
        });
    }
});