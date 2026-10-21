// pi/durable-models.ts — the model mirror (T-030, D5).
//
// pi-durable generations speak to a pi-ai `Models`. This adapter delegates to
// pi's own live ModelRegistry (auth, provider catalogue, streaming) instead of
// copying configuration, so a provider registered in pi — custom baseUrl
// included — streams through unchanged.
//
// The call surface pi-durable actually uses (verified against its dist):
// getModel, streamSimple, completeSimple, fetchDeferred, cancelDeferred,
// classify, generateImages. Auth/login and the deferred family are not on that
// surface: they throw with a reason rather than pretending.

import type {
	Api,
	AnyModel,
	AssistantImages,
	AssistantMessage,
	AssistantMessageEventStream,
	AuthInteraction,
	AuthOperationOptions,
	AuthResult,
	AuthType,
	ClassifierApi,
	ClassifierContext,
	ClassifierModel,
	ClassifierResult,
	Context,
	Credential,
	DeferredHandle,
	ImageApi,
	ImageModel,
	ImagesContext,
	LoginOptions,
	Model,
	Models,
	ModelsApiStreamOptions,
	ModelsClassifierOptions,
	ModelsDeferredCancelOptions,
	ModelsDeferredFetchOptions,
	ModelsImagesOptions,
	ModelsRefreshOptions,
	ModelsRefreshResult,
	ModelsSimpleStreamOptions,
	ModelType,
	ModelTypeMap,
	Provider,
} from "@earendil-works/pi-ai";
import type { ModelRegistry } from "@earendil-works/pi-coding-agent";

const NOT_ON_THE_BRIDGE = (what: string) =>
	`pi-dev durable bridge: ${what} is not available through the pi model registry bridge.`;

export class RegistryModels implements Models {
	constructor(private readonly registry: ModelRegistry) {}

	getProviders(): readonly Provider[] {
		const out: Provider[] = [];
		for (const id of this.registry.getRegisteredProviderIds()) {
			const provider = this.registry.getRegisteredNativeProvider(id);
			if (provider !== undefined) out.push(provider);
		}
		return out;
	}

	getProvider(id: string): Provider | undefined {
		return this.registry.getRegisteredNativeProvider(id);
	}

	getModels(provider?: string): readonly Model<Api>[] {
		return this.registry.getAll().filter((m) => provider === undefined || m.provider === provider);
	}

	getModel(provider: string, id: string): Model<Api> | undefined {
		return this.registry.find(provider, id);
	}

	getModelsOfType<TType extends ModelType>(type: TType, provider?: string): readonly ModelTypeMap[TType][] {
		return this.registry.getModelsOfType(type, provider);
	}

	getModelOfType<TType extends ModelType>(type: TType, provider: string, id: string): ModelTypeMap[TType] | undefined {
		return this.registry.getModelOfType(type, provider, id);
	}

	getAllModels(provider?: string): readonly AnyModel[] {
		const out: AnyModel[] = [];
		for (const type of ["chat", "image", "classifier"] as const) {
			for (const model of this.registry.getModelsOfType(type, provider)) out.push(model as AnyModel);
		}
		return out;
	}

	refresh(options?: ModelsRefreshOptions): Promise<ModelsRefreshResult> {
		return this.registry.refresh(options);
	}

	async getAvailable(providerId?: string, _options?: AuthOperationOptions): Promise<readonly Model<Api>[]> {
		const available = await this.registry.getAvailable();
		return providerId === undefined ? available : available.filter((m) => m.provider === providerId);
	}

	async getAvailableOfType<TType extends ModelType>(
		type: TType,
		providerId?: string,
		_options?: AuthOperationOptions,
	): Promise<readonly ModelTypeMap[TType>[]> {
		return this.getModelsOfType(type, providerId);
	}

	async getAllAvailable(providerId?: string, _options?: AuthOperationOptions): Promise<readonly AnyModel[]> {
		return this.getAllModels(providerId);
	}

	getAuth(providerId: string | AnyModel): Promise<AuthResult | undefined> {
		return this.registry.getProviderAuth(typeof providerId === "string" ? providerId : providerId.provider);
	}

	checkAuth(_providerId: string, _options?: AuthOperationOptions): Promise<AuthResult | undefined> {
		// Not on pi-durable's call surface; the registry's own auth states stay
		// authoritative for the live session.
		throw new Error(NOT_ON_THE_BRIDGE("checkAuth"));
	}

	login(_providerId: string, _type: AuthType, _interaction: AuthInteraction, _options?: LoginOptions): Promise<Credential> {
		throw new Error(NOT_ON_THE_BRIDGE("login"));
	}

	logout(_providerId: string, _options?: AuthOperationOptions): Promise<void> {
		throw new Error(NOT_ON_THE_BRIDGE("logout"));
	}

	stream<TApi extends Api>(model: Model<TApi>, context: Context, options?: ModelsApiStreamOptions<TApi>): AssistantMessageEventStream {
		return this.registry.stream(model, context, options);
	}

	complete<TApi extends Api>(model: Model<TApi>, context: Context, options?: ModelsApiStreamOptions<TApi>): Promise<AssistantMessage> {
		return this.registry.complete(model, context, options);
	}

	streamSimple(model: Model<Api>, context: Context, options?: ModelsSimpleStreamOptions): AssistantMessageEventStream {
		return this.registry.streamSimple(model, context, options);
	}

	completeSimple(model: Model<Api>, context: Context, options?: ModelsSimpleStreamOptions): Promise<AssistantMessage> {
		// pi-ai's own completeSimple is streamSimple(...).result(); same here.
		return this.registry.streamSimple(model, context, options).result();
	}

	streamDeferred(model: Model<Api>, _handle: DeferredHandle, _options?: ModelsDeferredFetchOptions): AssistantMessageEventStream {
		throw new Error(NOT_ON_THE_BRIDGE("deferred-response streaming"));
	}

	fetchDeferred(_model: Model<Api>, _handle: DeferredHandle, _options?: ModelsDeferredFetchOptions): Promise<AssistantMessage> {
		// Reached only when a provider emits a deferred handle mid-stream; the
		// registry's providers do not, so this stays a hard, honest error.
		throw new Error(NOT_ON_THE_BRIDGE("deferred-response polling"));
	}

	cancelDeferred(_model: Model<Api>, _handle: DeferredHandle, _options?: ModelsDeferredCancelOptions): Promise<void> {
		throw new Error(NOT_ON_THE_BRIDGE("deferred-response cancellation"));
	}

	generateImages(model: ImageModel<ImageApi>, context: ImagesContext, options?: ModelsImagesOptions): Promise<AssistantImages> {
		return this.registry.generateImages(model, context, options);
	}

	classify(model: ClassifierModel<ClassifierApi>, context: ClassifierContext, options?: ModelsClassifierOptions): Promise<ClassifierResult> {
		return this.registry.classify(model, context, options);
	}
}
