"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdatePreferenceDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_preference_dto_1 = require("./create-preference.dto");
class UpdatePreferenceDto extends (0, mapped_types_1.PartialType)(create_preference_dto_1.CreatePreferenceDto) {
}
exports.UpdatePreferenceDto = UpdatePreferenceDto;
//# sourceMappingURL=update-preference.dto.js.map