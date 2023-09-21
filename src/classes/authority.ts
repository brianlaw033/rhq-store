import { storedItem } from "../storedItem";


export class authority extends storedItem {
    getParent  ()  {
		const theParent = this.getRelatedItems("boundaries", this.getRegionISO(), "iso")[0];
		return theParent;
	};
    get formattedPhoneNumber  () {
        return formattedPhoneNumber(this.getValue("phone_number"));
    }
    get formattedFaxNumber  () {
        return formattedPhoneNumber(this.getValue("fax"));

    }  

}

const formattedPhoneNumber = (phone:string) => {
    if (!phone) return ''
    const tmp = [...phone.toString()]
    tmp.splice(0, 0, '0')
    tmp.splice(2, 0, ' ')
    tmp.splice(6, 0, ' ')
    return tmp.join('')
  }