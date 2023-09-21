import { requestLoad } from "..";
import { storedItem } from "../storedItem";
export class appMode extends storedItem {
	disableMode() {
	}

	setupMode() {
		const dataRequests = this.getValue("data_requests");
		if (dataRequests) {
			dataRequests.forEach((type: string) => {
				requestLoad(type);
			});
		}
	}
}
