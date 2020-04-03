const allowedFields = ['bedrooms', 'parking', 'petsAllowed']

const aparment = {
    bedrooms: 3,
    petsAllowed: true,
    parking: true
}
const newObj = {}; //first iteration newObj = {bedrooms: 3, parking: true}

Object.keys(aparment).forEach(el => {
    if (allowedFields.includes(el)) {
        newObj[el] = aparment[el]
    }

})

console.log(newObj);

// pug features
// h1= tour
// h1= user.toUpperCase()
// //- h1 Canotaje en Sangil    

// - const x = 200
// p=  2 * x
// p price: #{2 * x}