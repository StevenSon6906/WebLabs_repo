import {getAllChainsaws, postChainsaw, deleteChainsaw, updateChainsaw} from "./api.js";

let chainsaws = [];
// {   name: 'DSG-62H',
//     watts: 2900,
//     rotationsPerMinute: 3200,
//     imgUrl: 'https://static.dnipro-m.ua/cache/products/5684/catalog_origin_317907.jpg',
// },
// {   name: 'DSG-25H',
//     watts: 750,
//     rotationsPerMinute: 3500,
//     imgUrl: 'https://static.dnipro-m.ua/cache/products/9689/catalog_origin_476226.jpg',
// },
// {   name: 'Imperial Chainsword Mk.VI',
//     watts: 3000,
//     rotationsPerMinute: 7000,
//     imgUrl: 'https://www.king-cart.com/store/oknight/IF_403515_Chainsword.jpg',
// },

// Get HTML elements by their new IDs
const openModalCreate = document.getElementById("open-modal-create-button");
const createChainsawForm = document.getElementById('chainsawCreateForm'); 
const closeModalButton = document.querySelector('.btn-close'); 
const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');
const isSortByPower = document.getElementById('sort-by-power');
const exceptionModalElement = document.getElementById('exceptionModal');
const exceptionMessage = document.getElementById('exceptionMessage');

// Chainsaws fetching - НОВЕ
const refetchAllChainsaws = async () => {
    const allChainsaws = await getAllChainsaws();

    chainsaws = allChainsaws;

    drawList(chainsaws)
}

// Sorting chainsaws by power (watts) ГОТОВО
isSortByPower?.addEventListener('click', () => {
    if (isSortByPower.checked) {
        const sortedChainsaws = chainsaws.slice(0).sort((a, b) => b.watts - a.watts);
        drawList(sortedChainsaws);
    } else {
        drawList(chainsaws);
    }
});

// Exception
const openExceptionModal = (message) => {
    exceptionMessage.textContent = message;
    const exceptionModal = new bootstrap.Modal(exceptionModalElement);
    exceptionModal.show();
};

// Open create chainsaw modal
openModalCreate?.addEventListener('click', () => {
    const createModal = new bootstrap.Modal(document.getElementById('create-modal'));
    createModal.show();
});

// Close create modal 
closeModalButton?.addEventListener('click', () => {
    const createModal = bootstrap.Modal.getInstance(document.getElementById('create-modal'));
    createModal.hide();
});


// Search functionality
searchButton?.addEventListener('click', () => {

    const searchValue = searchInput.value;
    const filteredChainsaws = chainsaws.filter((chainsaw) =>
        chainsaw.name.toLowerCase().includes(searchValue.toLowerCase())
    );
    drawList(filteredChainsaws);
});

// Creating - ЗМІНЕНО
createChainsawForm?.addEventListener('submit', async (event) => {
    event.preventDefault();

    const formData = new FormData(createChainsawForm);
    const title = formData.get('Name');
    const power = parseFloat(formData.get('Power'));
    const rotationsPerMinute = parseFloat(formData.get('RPM'));
    const imageUrl = formData.get('ImageUrl');

    const newChainsaw = { name: title, watts: power, imgUrl: imageUrl, rotationsPerMinute: rotationsPerMinute };

    if (validateInput(newChainsaw)) {
            await postChainsaw(newChainsaw).then(refetchAllChainsaws); // Виклик postChainsaw для відправки на сервеh
            createChainsawForm.reset();      // Скидаємо форму
            const createModal = bootstrap.Modal.getInstance(document.getElementById('create-modal'));
            createModal.hide();
    }
});

// Validation
const validateInput = (chainsaw) => {
    if (!chainsaw.name) {
        openExceptionModal("Name is required");
        return false;
    }
    if (!chainsaw.watts || chainsaw.watts <= 0) {
        openExceptionModal("Power (Watts) is required and must be greater than 0");
        return false;
    }
    if (!chainsaw.rotationsPerMinute || chainsaw.rotationsPerMinute <= 0) {
        openExceptionModal("RPM is required and must be greater than 0");
        return false;
    }
    if (!chainsaw.imgUrl) {
        openExceptionModal("Image URL is required");
        return false;
    }
    const imageReg = /[\/.](jpg|jpeg|tiff|png)$/i;
    if (!imageReg.test(chainsaw.imgUrl)) {
        openExceptionModal("Invalid image URL format. Accepted formats: jpg, jpeg, tiff, png");
        return false;
    }

    return true;
};

// Remove chainsaw - ЗМІНЕНО
const removeChainsaw = async (index) => {
    const chainsawToDelete = chainsaws[index];
    chainsaws.splice(index, 1);
    await deleteChainsaw(chainsawToDelete.id);
    drawList(chainsaws);
};

// Edit - ЗМІНЕНО
const editChainsaw = async (index) => {
    const chainsawToUpdate = chainsaws[index];
    const form = document.getElementById('chainsawEditForm');
    form['Name'].value = chainsawToUpdate.name;
    form['Power'].value = chainsawToUpdate.watts;
    form['RPM'].value = chainsawToUpdate.rotationsPerMinute;
    form['ImageUrl'].value = chainsawToUpdate.imgUrl;

    const editModal = new bootstrap.Modal(document.getElementById('edit-modal'));
    editModal.show();

    const submitEditForm = document.getElementById("submit-edit-form");

    submitEditForm.replaceWith(submitEditForm.cloneNode(true));
    const newSubmitEditForm = document.getElementById("submit-edit-form");

    newSubmitEditForm.addEventListener('click', async (event) => {
        event.preventDefault();

        const formData = new FormData(form);
        const updatedName = formData.get('Name');
        const updatedPower = parseFloat(formData.get('Power'));
        const updatedRPM = parseFloat(formData.get('RPM'));
        const updatedImageUrl = formData.get('ImageUrl');

        if (validateInput({
            name: updatedName,
            watts: updatedPower,
            rotationsPerMinute: updatedRPM,
            imgUrl: updatedImageUrl })) {
            chainsaws[index] = {
                ...chainsawToUpdate,
                name: updatedName,
                watts: updatedPower,
                rotationsPerMinute: updatedRPM,
                imgUrl: updatedImageUrl
            };

            // Відправка PUT запиту на сервер
            await updateChainsaw(chainsaws[index].id, chainsaws[index]).then(refetchAllChainsaws);

            editModal.hide();
        }
    });
};

// Відобрадення
const drawList = (chainsawList) => {
    const totalChainsaws = document.getElementById('total-chainsaws');
    totalChainsaws.textContent = chainsawList.length.toString();
    
    const mainPageShow = document.getElementById("main-page");
    mainPageShow.innerHTML = '';
    chainsawList.forEach((el, idx) => {
        const card = document.createElement('div');
        card.className = "col-md-4";
        card.innerHTML = `
            <div class="card bg-secondary text-white shadow-sm h-100">
                <img src="${el.imgUrl}" class="card-img-top" alt="${el.name}">
                <div class="card-body">
                    <h5 class="card-title">${el.name}</h5>
                    <p class="card-text">Power: ${el.watts} Watts</p>
                    <p class="card-text">RPM: ${el.rotationsPerMinute}</p>
                </div>
                <div class="card-footer d-flex justify-content-between">
                    <button class="btn btn-warning" id="edit-${idx}">Edit</button>
                    <button class="btn btn-danger" id="remove-${idx}">Remove</button>
                </div>
            </div>
        `;

        mainPageShow.appendChild(card);

        document.getElementById(`edit-${idx}`).addEventListener('click', () => editChainsaw(idx));
        document.getElementById(`remove-${idx}`).addEventListener('click', () => removeChainsaw(idx));
    });
};

drawList(chainsaws);

getAllChainsaws().then(console.log)
refetchAllChainsaws();
